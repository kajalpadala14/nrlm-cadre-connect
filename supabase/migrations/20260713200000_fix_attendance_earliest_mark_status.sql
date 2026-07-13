-- Fix attendance status classification around the 19:00 IST deadline.
--
-- Root cause:
--   mark_activity_attendance() could downgrade an already-present daily
--   attendance row to late when a later activity/photo was processed after
--   19:00 IST. The daily status must be based on the earliest valid attendance
--   mark for that cadre/date.
--
-- Rules:
--   earliest mark <= 19:00 IST -> present
--   earliest mark  > 19:00 IST -> late
--   no mark after the daily job -> absent

CREATE OR REPLACE FUNCTION public.attendance_deadline_ist(p_target_date DATE)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (p_target_date::TEXT || ' 19:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
$$;

GRANT EXECUTE ON FUNCTION public.attendance_deadline_ist(DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.classify_attendance_status(
  p_upload_ts TIMESTAMPTZ,
  p_activity_date DATE
)
RETURNS public.attendance_status
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_upload_ts <= public.attendance_deadline_ist(p_activity_date) THEN
    RETURN 'present'::public.attendance_status;
  END IF;

  RETURN 'late'::public.attendance_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.classify_attendance_status(TIMESTAMPTZ, DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.normalize_attendance_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mark_ts TIMESTAMPTZ;
BEGIN
  -- check_in_at is the canonical daily attendance mark. photo_uploaded_at is
  -- kept for audit/evidence, but should not downgrade an earlier check-in.
  v_mark_ts := COALESCE(NEW.check_in_at, NEW.photo_uploaded_at);

  IF NEW.status IN ('present', 'late') AND v_mark_ts IS NOT NULL THEN
    NEW.status := public.classify_attendance_status(v_mark_ts, NEW.date);
  END IF;

  IF NEW.attendance_date IS NULL THEN
    NEW.attendance_date := NEW.date;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_normalize_status ON public.attendance;
CREATE TRIGGER trg_attendance_normalize_status
  BEFORE INSERT OR UPDATE OF status, check_in_at, photo_uploaded_at, date
  ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_attendance_status();

CREATE OR REPLACE FUNCTION public.mark_activity_attendance(p_activity_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity public.activities%ROWTYPE;
  v_existing public.attendance%ROWTYPE;
  v_photo public.evidence_files%ROWTYPE;
  v_effective_mark_ts TIMESTAMPTZ;
  v_new_status public.attendance_status;
  v_attendance_id UUID;
  v_had_existing_attendance BOOLEAN := false;
BEGIN
  SELECT * INTO v_activity
  FROM public.activities
  WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity % not found', p_activity_id;
  END IF;

  IF auth.uid() IS NOT NULL
     AND v_activity.cadre_id <> auth.uid()
     AND NOT public.is_admin(auth.uid())
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id)
     AND NOT public.can_access_profile(auth.uid(), v_activity.cadre_id) THEN
    RAISE EXCEPTION 'Not allowed to mark attendance for this activity';
  END IF;

  SELECT * INTO v_photo
  FROM public.evidence_files e
  WHERE e.activity_id = p_activity_id
    AND COALESCE(e.mime_type, '') LIKE 'image/%'
    AND e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND e.latitude BETWEEN -90 AND 90
    AND e.longitude BETWEEN -180 AND 180
  ORDER BY e.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_existing
  FROM public.attendance
  WHERE cadre_id = v_activity.cadre_id
    AND date = v_activity.activity_date
  LIMIT 1;
  v_had_existing_attendance := FOUND;

  IF v_had_existing_attendance
     AND v_existing.status IN ('present', 'late')
     AND (v_existing.check_in_at IS NOT NULL OR v_existing.photo_uploaded_at IS NOT NULL) THEN
    v_effective_mark_ts := LEAST(
      COALESCE(v_existing.check_in_at, 'infinity'::TIMESTAMPTZ),
      COALESCE(v_existing.photo_uploaded_at, 'infinity'::TIMESTAMPTZ),
      v_photo.created_at
    );
  ELSE
    -- Absent/pending users who submit after 19:00 become late; before/equal
    -- 19:00 become present. Ignore stale timestamps on absent/pending rows.
    v_effective_mark_ts := v_photo.created_at;
  END IF;

  v_new_status := public.classify_attendance_status(
    v_effective_mark_ts,
    v_activity.activity_date
  );

  IF v_had_existing_attendance THEN
    v_attendance_id := v_existing.id;

    UPDATE public.attendance
    SET status = CASE
          WHEN v_existing.status IN ('on_leave', 'holiday') THEN v_existing.status
          ELSE v_new_status
        END,
        photo_uploaded_at = CASE
          WHEN v_existing.photo_uploaded_at IS NULL THEN v_photo.created_at
          ELSE LEAST(v_existing.photo_uploaded_at, v_photo.created_at)
        END,
        check_in_at = CASE
          WHEN v_existing.status IN ('on_leave', 'holiday') THEN v_existing.check_in_at
          ELSE v_effective_mark_ts
        END,
        block_id = COALESCE(v_existing.block_id, v_activity.block_id),
        latitude = COALESCE(v_existing.latitude, v_photo.latitude),
        longitude = COALESCE(v_existing.longitude, v_photo.longitude),
        recorded_by = COALESCE(v_existing.recorded_by, v_activity.cadre_id),
        updated_at = now()
    WHERE id = v_attendance_id;
  ELSE
    INSERT INTO public.attendance (
      cadre_id,
      block_id,
      date,
      attendance_date,
      status,
      photo_uploaded_at,
      check_in_at,
      latitude,
      longitude,
      recorded_by
    )
    VALUES (
      v_activity.cadre_id,
      v_activity.block_id,
      v_activity.activity_date,
      v_activity.activity_date,
      v_new_status,
      v_photo.created_at,
      v_effective_mark_ts,
      v_photo.latitude,
      v_photo.longitude,
      v_activity.cadre_id
    )
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = CASE
            WHEN public.attendance.status IN ('on_leave', 'holiday') THEN public.attendance.status
            ELSE public.classify_attendance_status(
              CASE
                WHEN public.attendance.status IN ('present', 'late')
                     AND (public.attendance.check_in_at IS NOT NULL OR public.attendance.photo_uploaded_at IS NOT NULL)
                  THEN LEAST(
                    COALESCE(public.attendance.check_in_at, 'infinity'::TIMESTAMPTZ),
                    COALESCE(public.attendance.photo_uploaded_at, 'infinity'::TIMESTAMPTZ),
                    EXCLUDED.check_in_at
                  )
                ELSE EXCLUDED.check_in_at
              END,
              EXCLUDED.date
            )
          END,
          photo_uploaded_at = CASE
            WHEN public.attendance.photo_uploaded_at IS NULL THEN EXCLUDED.photo_uploaded_at
            ELSE LEAST(public.attendance.photo_uploaded_at, EXCLUDED.photo_uploaded_at)
          END,
          check_in_at = CASE
            WHEN public.attendance.status IN ('on_leave', 'holiday') THEN public.attendance.check_in_at
            WHEN public.attendance.status IN ('present', 'late')
                 AND (public.attendance.check_in_at IS NOT NULL OR public.attendance.photo_uploaded_at IS NOT NULL)
              THEN LEAST(
                COALESCE(public.attendance.check_in_at, 'infinity'::TIMESTAMPTZ),
                COALESCE(public.attendance.photo_uploaded_at, 'infinity'::TIMESTAMPTZ),
                EXCLUDED.check_in_at
              )
            ELSE EXCLUDED.check_in_at
          END,
          block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          latitude = COALESCE(public.attendance.latitude, EXCLUDED.latitude),
          longitude = COALESCE(public.attendance.longitude, EXCLUDED.longitude),
          recorded_by = COALESCE(public.attendance.recorded_by, EXCLUDED.recorded_by),
          updated_at = now()
    RETURNING id INTO v_attendance_id;
  END IF;

  IF to_regclass('public.activity_attendance_links') IS NOT NULL THEN
    INSERT INTO public.activity_attendance_links (
      activity_id,
      attendance_id,
      cadre_id,
      attendance_date,
      previous_attendance_id,
      previous_status,
      previous_check_in_at,
      previous_check_out_at,
      previous_recorded_by,
      previous_remarks,
      previous_rejection_reason
    )
    VALUES (
      p_activity_id,
      v_attendance_id,
      v_activity.cadre_id,
      v_activity.activity_date,
      CASE WHEN v_had_existing_attendance THEN v_existing.id ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.status ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.check_in_at ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.check_out_at ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.recorded_by ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.remarks ELSE NULL END,
      CASE WHEN v_had_existing_attendance THEN v_existing.rejection_reason ELSE NULL END
    )
    ON CONFLICT (activity_id) DO UPDATE
      SET attendance_id = EXCLUDED.attendance_id,
          cadre_id = EXCLUDED.cadre_id,
          attendance_date = EXCLUDED.attendance_date;
  END IF;

  RAISE LOG 'mark_activity_attendance earliest-mark: activity=%, cadre=%, date=%, mark_at=%, status=%',
    p_activity_id, v_activity.cadre_id, v_activity.activity_date, v_effective_mark_ts, v_new_status;

  RETURN v_attendance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_activity_attendance(UUID) TO authenticated, service_role;

-- Correct historical rows that were classified with the old 18:00 deadline or
-- downgraded by later same-day activity photos.
WITH classified AS (
  SELECT
    id,
    date,
    LEAST(
      COALESCE(check_in_at, 'infinity'::TIMESTAMPTZ),
      COALESCE(photo_uploaded_at, 'infinity'::TIMESTAMPTZ)
    ) AS effective_mark_ts
  FROM public.attendance
  WHERE status IN ('present', 'late')
    AND (check_in_at IS NOT NULL OR photo_uploaded_at IS NOT NULL)
),
finite_classified AS (
  SELECT
    id,
    public.classify_attendance_status(effective_mark_ts, date) AS corrected_status,
    effective_mark_ts
  FROM classified
  WHERE effective_mark_ts <> 'infinity'::TIMESTAMPTZ
)
UPDATE public.attendance a
SET status = fc.corrected_status,
    check_in_at = fc.effective_mark_ts,
    updated_at = now()
FROM finite_classified fc
WHERE a.id = fc.id
  AND (
    a.status IS DISTINCT FROM fc.corrected_status
    OR a.check_in_at IS DISTINCT FROM fc.effective_mark_ts
  );

NOTIFY pgrst, 'reload schema';
