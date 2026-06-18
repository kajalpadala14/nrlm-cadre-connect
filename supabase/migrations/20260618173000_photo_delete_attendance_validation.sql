-- Photo deletion and attendance validation.
-- Business rule: no photo evidence means no auto-generated attendance.

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
     AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to mark attendance for this activity';
  END IF;

  IF NOT public.activity_has_photo_evidence(p_activity_id) THEN
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
      recorded_by
    )
    VALUES (
      v_activity.cadre_id,
      v_activity.block_id,
      v_activity.activity_date,
      v_activity.activity_date,
      'present',
      now(),
      v_activity.cadre_id
    )
    RETURNING id INTO v_attendance_id;
  END IF;

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

  RETURN v_attendance_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_evidence_with_consistency(p_evidence_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_file public.evidence_files%ROWTYPE;
  v_activity public.activities%ROWTYPE;
  v_next_photo_url TEXT;
  v_photo_count INTEGER := 0;
BEGIN
  SELECT * INTO v_file
  FROM public.evidence_files
  WHERE id = p_evidence_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('deleted', false, 'reason', 'not_found');
  END IF;

  SELECT * INTO v_activity
  FROM public.activities
  WHERE id = v_file.activity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    DELETE FROM public.evidence_files WHERE id = p_evidence_id;
    RETURN jsonb_build_object('deleted', true, 'activity_missing', true);
  END IF;

  IF auth.uid() IS NOT NULL
     AND v_activity.cadre_id <> auth.uid()
     AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to delete this evidence';
  END IF;

  DELETE FROM public.evidence_files
  WHERE id = p_evidence_id;

  SELECT public_url INTO v_next_photo_url
  FROM public.evidence_files
  WHERE activity_id = v_activity.id
    AND COALESCE(mime_type, '') LIKE 'image/%'
  ORDER BY created_at ASC
  LIMIT 1;

  UPDATE public.activities
  SET photo_url = v_next_photo_url
  WHERE id = v_activity.id;

  SELECT COUNT(*) INTO v_photo_count
  FROM public.evidence_files
  WHERE activity_id = v_activity.id
    AND COALESCE(mime_type, '') LIKE 'image/%';

  IF v_photo_count = 0 THEN
    PERFORM public.reverse_activity_attendance(
      v_activity.id,
      v_activity.cadre_id,
      v_activity.activity_date
    );
  END IF;

  RETURN jsonb_build_object(
    'deleted', true,
    'activity_id', v_activity.id,
    'remaining_photo_count', v_photo_count,
    'photo_url', v_next_photo_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_data_consistency()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'activity_generated_attendance_without_activity',
      COALESCE((
        SELECT jsonb_agg(l)
        FROM public.activity_attendance_links l
        LEFT JOIN public.activities a ON a.id = l.activity_id
        WHERE a.id IS NULL
      ), '[]'::jsonb),
    'auto_attendance_without_photo_evidence',
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'attendance_id', att.id,
          'activity_id', l.activity_id,
          'cadre_id', att.cadre_id,
          'date', att.date
        ))
        FROM public.activity_attendance_links l
        JOIN public.attendance att ON att.id = l.attendance_id
        WHERE NOT public.activity_has_photo_evidence(l.activity_id)
      ), '[]'::jsonb),
    'legacy_auto_attendance_without_activity',
      COALESCE((
        SELECT jsonb_agg(att)
        FROM public.attendance att
        LEFT JOIN public.activities a
          ON a.cadre_id = att.cadre_id
         AND a.activity_date = att.date
        WHERE a.id IS NULL
          AND att.status = 'present'
          AND att.recorded_by = att.cadre_id
      ), '[]'::jsonb),
    'evidence_without_activity',
      COALESCE((
        SELECT jsonb_agg(e)
        FROM public.evidence_files e
        LEFT JOIN public.activities a ON a.id = e.activity_id
        WHERE a.id IS NULL
      ), '[]'::jsonb),
    'approvals_without_activity',
      COALESCE((
        SELECT jsonb_agg(ap)
        FROM public.activity_approvals ap
        LEFT JOIN public.activities a ON a.id = ap.activity_id
        WHERE a.id IS NULL
      ), '[]'::jsonb),
    'activities_without_profiles',
      COALESCE((
        SELECT jsonb_agg(a)
        FROM public.activities a
        LEFT JOIN public.profiles p ON p.id = a.cadre_id
        WHERE p.id IS NULL
      ), '[]'::jsonb),
    'attendance_without_profiles',
      COALESCE((
        SELECT jsonb_agg(att)
        FROM public.attendance att
        LEFT JOIN public.profiles p ON p.id = att.cadre_id
        WHERE p.id IS NULL
      ), '[]'::jsonb),
    'dashboard_aggregate_check',
      jsonb_build_object(
        'total_activities', (SELECT COUNT(*) FROM public.activities),
        'attendance_rows', (SELECT COUNT(*) FROM public.attendance),
        'evidence_rows', (SELECT COUNT(*) FROM public.evidence_files),
        'pending_activities', (SELECT COUNT(*) FROM public.activities WHERE status = 'Pending'),
        'approved_activities', (SELECT COUNT(*) FROM public.activities WHERE status = 'Approved'),
        'rejected_activities', (SELECT COUNT(*) FROM public.activities WHERE status = 'Rejected')
      )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
