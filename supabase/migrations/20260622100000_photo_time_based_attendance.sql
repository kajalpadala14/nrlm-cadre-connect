-- ============================================================
-- Photo Time-Based Attendance Classification
-- Business rules:
--   * Photo uploaded on activity_date at or before 18:00 IST → present
--   * Photo uploaded on activity_date after  18:00 IST → late
--   * No qualifying photo by end-of-day           → absent
--   * No photo yet, before 18:00 IST (today only) → pending (UI-derived, no DB row)
-- ============================================================

-- 1. Add 'late' and 'pending' to the attendance_status enum
--    (IF NOT EXISTS guards make this re-runnable)
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'late';
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'pending';

-- 2. Add photo_uploaded_at column to attendance table
--    Stores the server-side created_at of the qualifying evidence_file.
--    Set server-side — clients cannot forge this timestamp.
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- ============================================================
-- 3. Core classification helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.classify_attendance_status(
  p_upload_ts   TIMESTAMPTZ,
  p_activity_date DATE
)
RETURNS public.attendance_status
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upload_ist   TIMESTAMPTZ;
  v_deadline_ist TIMESTAMPTZ;
BEGIN
  -- Convert upload timestamp to IST (UTC+5:30)
  v_upload_ist   := p_upload_ts AT TIME ZONE 'Asia/Kolkata';
  -- Deadline: activity_date 18:00:00 IST
  v_deadline_ist := (p_activity_date::TEXT || ' 18:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';

  IF v_upload_ist <= v_deadline_ist THEN
    RETURN 'present'::public.attendance_status;
  ELSE
    RETURN 'late'::public.attendance_status;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.classify_attendance_status(TIMESTAMPTZ, DATE) TO authenticated, service_role;

-- ============================================================
-- 4. Rewrite mark_activity_attendance — time-aware version
--    Replaces all previous versions.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_activity_attendance(p_activity_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity       public.activities%ROWTYPE;
  v_photo          public.evidence_files%ROWTYPE;
  v_existing       public.attendance%ROWTYPE;
  v_new_status     public.attendance_status;
  v_attendance_id  UUID;
  v_had_existing   BOOLEAN := false;
BEGIN
  -- Fetch activity
  SELECT * INTO v_activity
  FROM public.activities
  WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity % not found', p_activity_id;
  END IF;

  -- Authorization check
  IF auth.uid() IS NOT NULL
     AND v_activity.cadre_id <> auth.uid()
     AND NOT public.is_admin(auth.uid())
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id) THEN
    RAISE EXCEPTION 'Not allowed to mark attendance for this activity';
  END IF;

  -- Fetch the earliest geo-tagged image evidence for this activity
  SELECT * INTO v_photo
  FROM public.evidence_files e
  WHERE e.activity_id = p_activity_id
    AND COALESCE(e.mime_type, '') LIKE 'image/%'
    AND e.latitude  IS NOT NULL
    AND e.longitude IS NOT NULL
    AND e.latitude  BETWEEN -90  AND 90
    AND e.longitude BETWEEN -180 AND 180
  ORDER BY e.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    -- No qualifying photo — cannot mark attendance
    RETURN NULL;
  END IF;

  -- Classify based on photo upload timestamp vs 18:00 IST deadline
  v_new_status := public.classify_attendance_status(
    v_photo.created_at,
    v_activity.activity_date
  );

  -- Look for an existing attendance row for this cadre on this date
  SELECT * INTO v_existing
  FROM public.attendance
  WHERE cadre_id = v_activity.cadre_id
    AND date = v_activity.activity_date
  LIMIT 1;
  v_had_existing := FOUND;

  IF v_had_existing THEN
    v_attendance_id := v_existing.id;

    -- Only upgrade/change if the new status is at least as good.
    -- Safety invariant: never downgrade present → late → absent.
    -- Rule: present > late > absent/pending.  We allow present→late if photo
    -- was re-evaluated (idempotent) but NEVER downgrade present to absent/pending.
    IF NOT (
      (v_existing.status = 'present' AND v_new_status <> 'present')
    ) THEN
      UPDATE public.attendance
      SET status           = v_new_status,
          photo_uploaded_at = v_photo.created_at,
          check_in_at      = COALESCE(check_in_at, v_photo.created_at),
          block_id         = COALESCE(block_id, v_activity.block_id),
          latitude         = v_photo.latitude,
          longitude        = v_photo.longitude,
          recorded_by      = COALESCE(recorded_by, v_activity.cadre_id),
          updated_at       = now()
      WHERE id = v_attendance_id;
    END IF;

  ELSE
    -- Insert new attendance row
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
      v_photo.created_at,
      v_photo.latitude,
      v_photo.longitude,
      v_activity.cadre_id
    )
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status            = CASE
                                WHEN public.attendance.status = 'present' THEN 'present'
                                ELSE EXCLUDED.status
                              END,
          photo_uploaded_at = EXCLUDED.photo_uploaded_at,
          check_in_at       = COALESCE(public.attendance.check_in_at, EXCLUDED.check_in_at),
          block_id          = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          latitude          = EXCLUDED.latitude,
          longitude         = EXCLUDED.longitude,
          recorded_by       = COALESCE(public.attendance.recorded_by, EXCLUDED.recorded_by),
          updated_at        = now()
    RETURNING id INTO v_attendance_id;
  END IF;

  -- Upsert activity_attendance_links for traceability
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
      CASE WHEN v_had_existing THEN v_existing.id        ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.status    ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.check_in_at   ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.check_out_at  ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.recorded_by   ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.remarks        ELSE NULL END,
      CASE WHEN v_had_existing THEN v_existing.rejection_reason ELSE NULL END
    )
    ON CONFLICT (activity_id) DO UPDATE
      SET attendance_id    = EXCLUDED.attendance_id,
          cadre_id         = EXCLUDED.cadre_id,
          attendance_date  = EXCLUDED.attendance_date;
  END IF;

  RETURN v_attendance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_activity_attendance(UUID) TO authenticated, service_role;

-- ============================================================
-- 5. End-of-day batch job: mark absent cadres
--    Safe to run multiple times (idempotent).
--    Never downgrades present or late.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_end_of_day_attendance(
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marked_absent INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Guard: cannot process future dates
  IF p_target_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot process attendance for a future date: %', p_target_date;
  END IF;

  -- For every cadre who had at least one activity on target_date
  -- but has NO present/late/on_leave/holiday attendance record for that date,
  -- upsert an absent record.
  FOR v_rec IN
    SELECT DISTINCT a.cadre_id, a.block_id
    FROM public.activities a
    WHERE a.activity_date = p_target_date
    EXCEPT
    SELECT att.cadre_id, att.block_id
    FROM public.attendance att
    WHERE att.date = p_target_date
      AND att.status IN ('present', 'late', 'on_leave', 'holiday')
  LOOP
    INSERT INTO public.attendance (
      cadre_id, block_id, date, attendance_date, status, recorded_by
    )
    VALUES (
      v_rec.cadre_id,
      v_rec.block_id,
      p_target_date,
      p_target_date,
      'absent',
      NULL
    )
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status     = 'absent',
          updated_at = now()
    WHERE public.attendance.status NOT IN ('present', 'late', 'on_leave', 'holiday');

    -- Count rows actually changed (not skipped due to WHERE guard)
    IF FOUND THEN
      v_marked_absent := v_marked_absent + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'target_date',   p_target_date,
    'marked_absent', v_marked_absent
  );
END;
$$;

-- Restrict to service_role only — this is an end-of-day batch job.
GRANT EXECUTE ON FUNCTION public.process_end_of_day_attendance(DATE) TO service_role;

-- ============================================================
-- 6. Update activity_has_photo_evidence helper (unchanged logic,
--    but kept consistent with geo-tag requirement)
-- ============================================================
CREATE OR REPLACE FUNCTION public.activity_has_photo_evidence(p_activity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.evidence_files e
    WHERE e.activity_id = p_activity_id
      AND COALESCE(e.mime_type, '') LIKE 'image/%'
      AND e.latitude  IS NOT NULL
      AND e.longitude IS NOT NULL
      AND e.latitude  BETWEEN -90  AND 90
      AND e.longitude BETWEEN -180 AND 180
  );
$$;

GRANT EXECUTE ON FUNCTION public.activity_has_photo_evidence(UUID) TO authenticated, service_role;

-- ============================================================
-- 7. Performance index on photo_uploaded_at (for audit queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_photo_uploaded_at
  ON public.attendance(photo_uploaded_at)
  WHERE photo_uploaded_at IS NOT NULL;

-- ============================================================
-- 8. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
