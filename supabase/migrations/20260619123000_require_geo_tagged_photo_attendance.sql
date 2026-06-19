-- Attendance requires geo-tagged image evidence.
-- PDF/document evidence remains optional and is never used to mark attendance.

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
      AND e.latitude IS NOT NULL
      AND e.longitude IS NOT NULL
      AND e.latitude BETWEEN -90 AND 90
      AND e.longitude BETWEEN -180 AND 180
  );
$$;

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
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id) THEN
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

  IF v_had_existing_attendance THEN
    v_attendance_id := v_existing.id;

    UPDATE public.attendance
    SET status = 'present',
        check_in_at = COALESCE(check_in_at, now()),
        block_id = COALESCE(block_id, v_activity.block_id),
        latitude = v_photo.latitude,
        longitude = v_photo.longitude,
        recorded_by = COALESCE(recorded_by, v_activity.cadre_id),
        updated_at = now()
    WHERE id = v_attendance_id;
  ELSE
    INSERT INTO public.attendance (
      cadre_id,
      block_id,
      date,
      attendance_date,
      status,
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
      'present',
      now(),
      v_photo.latitude,
      v_photo.longitude,
      v_activity.cadre_id
    )
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = 'present',
          check_in_at = COALESCE(public.attendance.check_in_at, now()),
          block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
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

  RETURN v_attendance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activity_has_photo_evidence(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_activity_attendance(UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
