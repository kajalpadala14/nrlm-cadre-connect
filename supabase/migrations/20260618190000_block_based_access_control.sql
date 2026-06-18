-- Enforce district-admin/all-block and block-officer/own-block access.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.user_block_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT block_id FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_block(_user_id UUID, _block_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(_user_id)
    OR (
      public.has_role(_user_id, 'block_officer')
      AND _block_id IS NOT NULL
      AND _block_id = public.user_block_id(_user_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_profile(_user_id UUID, _profile_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _profile_id = _user_id
    OR public.is_admin(_user_id)
    OR (
      public.has_role(_user_id, 'block_officer')
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = _profile_id
          AND p.block_id = public.user_block_id(_user_id)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_block_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_block(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_profile(uuid, uuid) TO authenticated, service_role;

-- Blocks: admins see/manage all; block officers see only their assigned block.
DROP POLICY IF EXISTS "Authenticated can read blocks" ON public.blocks;
DROP POLICY IF EXISTS "Admins manage blocks" ON public.blocks;
CREATE POLICY "Admins read all blocks" ON public.blocks
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Block officers read assigned block" ON public.blocks
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'block_officer')
    AND id = public.user_block_id(auth.uid())
  );
CREATE POLICY "Admins manage blocks" ON public.blocks
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Profiles: admins see all; block officers only their own block; users see self.
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Block officers read assigned block profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'block_officer')
    AND block_id = public.user_block_id(auth.uid())
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- User roles: admins see all; block officers see roles for profiles in their block.
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Staff read all roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Block officers read assigned block roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'block_officer')
    AND public.can_access_profile(auth.uid(), user_id)
  );

-- Activities: block officers can only read/update activities in their assigned block.
DROP POLICY IF EXISTS "Cadres read own activities" ON public.activities;
DROP POLICY IF EXISTS "Staff read all activities" ON public.activities;
DROP POLICY IF EXISTS "Cadres insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Cadres update own activities" ON public.activities;
DROP POLICY IF EXISTS "Admins manage activities" ON public.activities;
DROP POLICY IF EXISTS "Staff update all activities" ON public.activities;
DROP POLICY IF EXISTS "Cadres delete own activities" ON public.activities;
CREATE POLICY "Cadres read own activities" ON public.activities
  FOR SELECT TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Admins read all activities" ON public.activities
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Block officers read assigned block activities" ON public.activities
  FOR SELECT TO authenticated USING (public.can_access_block(auth.uid(), block_id));
CREATE POLICY "Cadres insert own activities" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (
    cadre_id = auth.uid()
    AND (
      block_id IS NULL
      OR block_id = public.user_block_id(auth.uid())
    )
  );
CREATE POLICY "Cadres update own activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (cadre_id = auth.uid())
  WITH CHECK (
    cadre_id = auth.uid()
    AND (
      block_id IS NULL
      OR block_id = public.user_block_id(auth.uid())
    )
  );
CREATE POLICY "Staff update scoped activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
  );
CREATE POLICY "Cadres delete own activities" ON public.activities
  FOR DELETE TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Admins manage activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Attendance: block officers can only read/write their assigned block.
DROP POLICY IF EXISTS "Cadres read own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff read all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Cadres insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Cadres update own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff manage all attendance" ON public.attendance;
CREATE POLICY "Cadres read own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Admins read all attendance" ON public.attendance
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Block officers read assigned block attendance" ON public.attendance
  FOR SELECT TO authenticated USING (public.can_access_block(auth.uid(), block_id));
CREATE POLICY "Cadres insert own attendance" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    cadre_id = auth.uid()
    AND (
      block_id IS NULL
      OR block_id = public.user_block_id(auth.uid())
    )
  );
CREATE POLICY "Cadres update own attendance" ON public.attendance
  FOR UPDATE TO authenticated
  USING (cadre_id = auth.uid())
  WITH CHECK (
    cadre_id = auth.uid()
    AND (
      block_id IS NULL
      OR block_id = public.user_block_id(auth.uid())
    )
  );
CREATE POLICY "Staff manage scoped attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.can_access_block(auth.uid(), block_id)
  );

-- Evidence files inherit access from their activity block.
DROP POLICY IF EXISTS "Cadres read own evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Staff read all evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Cadres insert own evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Cadres delete own evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Staff manage all evidence files" ON public.evidence_files;
CREATE POLICY "Cadres read own evidence files" ON public.evidence_files
  FOR SELECT TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Staff read scoped evidence files" ON public.evidence_files
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  );
CREATE POLICY "Cadres insert own evidence files" ON public.evidence_files
  FOR INSERT TO authenticated WITH CHECK (cadre_id = auth.uid());
CREATE POLICY "Cadres delete own evidence files" ON public.evidence_files
  FOR DELETE TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Staff manage scoped evidence files" ON public.evidence_files
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  );

-- Activity approvals inherit access from their activity block.
ALTER TABLE public.activity_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage all activity approvals" ON public.activity_approvals;
DROP POLICY IF EXISTS "Staff read all activity approvals" ON public.activity_approvals;
CREATE POLICY "Staff read scoped activity approvals" ON public.activity_approvals
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  );
CREATE POLICY "Staff manage scoped activity approvals" ON public.activity_approvals
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND public.can_access_block(auth.uid(), a.block_id)
    )
  );

-- Activity-attendance links inherit access from their block when the table exists.
DO $$
BEGIN
  IF to_regclass('public.activity_attendance_links') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.activity_attendance_links ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage all activity attendance links" ON public.activity_attendance_links';
    EXECUTE 'CREATE POLICY "Staff manage scoped activity attendance links" ON public.activity_attendance_links
      FOR ALL TO authenticated
      USING (
        public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.activities a
          WHERE a.id = activity_id
            AND public.can_access_block(auth.uid(), a.block_id)
        )
      )
      WITH CHECK (
        public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.activities a
          WHERE a.id = activity_id
            AND public.can_access_block(auth.uid(), a.block_id)
        )
      )';
  END IF;
END $$;

-- Leave requests inherit access from their block when the table exists.
DO $$
BEGIN
  IF to_regclass('public.leave_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage all leave requests" ON public.leave_requests';
    EXECUTE 'DROP POLICY IF EXISTS "Staff read all leave requests" ON public.leave_requests';
    EXECUTE 'CREATE POLICY "Cadres read own leave requests" ON public.leave_requests
      FOR SELECT TO authenticated USING (cadre_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Cadres insert own leave requests" ON public.leave_requests
      FOR INSERT TO authenticated WITH CHECK (cadre_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Staff manage scoped leave requests" ON public.leave_requests
      FOR ALL TO authenticated
      USING (public.is_admin(auth.uid()) OR public.can_access_block(auth.uid(), block_id))
      WITH CHECK (public.is_admin(auth.uid()) OR public.can_access_block(auth.uid(), block_id))';
  END IF;
END $$;

-- Re-scope SECURITY DEFINER RPCs that previously allowed all staff.
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
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id) THEN
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
     AND NOT public.can_access_block(auth.uid(), v_activity.block_id) THEN
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

-- Storage objects: staff read is scoped by the cadre UUID in the first path segment.
DROP POLICY IF EXISTS "Cadres read own photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff read all activity photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff read all photos" ON storage.objects;
CREATE POLICY "Scoped users read activity photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'activity-photos'
  AND (
    public.is_admin(auth.uid())
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.can_access_profile(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);
