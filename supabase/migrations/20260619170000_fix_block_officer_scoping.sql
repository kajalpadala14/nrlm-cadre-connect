-- Update RLS policies and RPC functions to fix block officer own-block scoping for NULL block_id records.

-- 1. Activities table policies
DROP POLICY IF EXISTS "Block officers read assigned block activities" ON public.activities;
CREATE POLICY "Block officers read assigned block activities" ON public.activities
  FOR SELECT TO authenticated
  USING (
    public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  );

DROP POLICY IF EXISTS "Staff update scoped activities" ON public.activities;
CREATE POLICY "Staff update scoped activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  );

-- 2. Attendance table policies
DROP POLICY IF EXISTS "Block officers read assigned block attendance" ON public.attendance;
CREATE POLICY "Block officers read assigned block attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  );

DROP POLICY IF EXISTS "Staff manage scoped attendance" ON public.attendance;
CREATE POLICY "Staff manage scoped attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
    OR public.can_access_profile(auth.uid(), cadre_id)
  );

-- 3. Evidence files table policies
DROP POLICY IF EXISTS "Staff read scoped evidence files" ON public.evidence_files;
CREATE POLICY "Staff read scoped evidence files" ON public.evidence_files
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  );

DROP POLICY IF EXISTS "Staff manage scoped evidence files" ON public.evidence_files;
CREATE POLICY "Staff manage scoped evidence files" ON public.evidence_files
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  );

-- 4. Activity approvals table policies
DROP POLICY IF EXISTS "Staff read scoped activity approvals" ON public.activity_approvals;
CREATE POLICY "Staff read scoped activity approvals" ON public.activity_approvals
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  );

DROP POLICY IF EXISTS "Staff manage scoped activity approvals" ON public.activity_approvals;
CREATE POLICY "Staff manage scoped activity approvals" ON public.activity_approvals
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          public.can_access_block(auth.uid(), a.block_id)
          OR public.can_access_profile(auth.uid(), a.cadre_id)
        )
    )
  );

-- 5. Helper RPC functions updates
CREATE OR REPLACE FUNCTION public.delete_activity_with_consistency(p_activity_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity public.activities%ROWTYPE;
BEGIN
  SELECT * INTO v_activity
  FROM public.activities
  WHERE id = p_activity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL
     AND v_activity.cadre_id <> auth.uid()
     AND NOT public.is_admin(auth.uid())
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id)
     AND NOT public.can_access_profile(auth.uid(), v_activity.cadre_id) THEN
    RAISE EXCEPTION 'Not allowed to delete this activity';
  END IF;

  IF to_regclass('public.activity_attendance_links') IS NOT NULL THEN
    DELETE FROM public.activity_attendance_links
    WHERE activity_id = p_activity_id;
  ELSE
    DELETE FROM public.attendance att
    WHERE att.cadre_id = v_activity.cadre_id
      AND att.date = v_activity.activity_date
      AND att.status = 'present'
      AND att.recorded_by = v_activity.cadre_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.activities a
        WHERE a.cadre_id = v_activity.cadre_id
          AND a.activity_date = v_activity.activity_date
          AND a.id <> p_activity_id
      );
  END IF;

  DELETE FROM public.activities
  WHERE id = p_activity_id;
END;
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
     AND NOT public.is_admin(auth.uid())
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id)
     AND NOT public.can_access_profile(auth.uid(), v_activity.cadre_id) THEN
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

GRANT EXECUTE ON FUNCTION public.delete_activity_with_consistency(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_activity_attendance(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_evidence_with_consistency(UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
