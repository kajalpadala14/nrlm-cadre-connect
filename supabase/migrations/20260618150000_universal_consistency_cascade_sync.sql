-- Universal Data Consistency & Cascade Synchronization
-- Source-of-truth rules:
-- 1. Dashboards/reports derive from live tables.
-- 2. Activity-generated attendance is linked and reversible.
-- 3. Evidence/approval rows cascade with activities.
-- 4. Realtime publications include all consistency-critical tables.

CREATE TABLE IF NOT EXISTS public.activity_attendance_links (
  activity_id UUID PRIMARY KEY REFERENCES public.activities(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  cadre_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  previous_attendance_id UUID,
  previous_status public.attendance_status,
  previous_check_in_at TIMESTAMPTZ,
  previous_check_out_at TIMESTAMPTZ,
  previous_recorded_by UUID,
  previous_remarks TEXT,
  previous_rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_attendance_links_attendance
  ON public.activity_attendance_links(attendance_id);
CREATE INDEX IF NOT EXISTS idx_activity_attendance_links_cadre_date
  ON public.activity_attendance_links(cadre_id, attendance_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_attendance_links TO authenticated;
GRANT ALL ON public.activity_attendance_links TO service_role;

ALTER TABLE public.activity_attendance_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cadres read own activity attendance links" ON public.activity_attendance_links;
CREATE POLICY "Cadres read own activity attendance links"
  ON public.activity_attendance_links
  FOR SELECT TO authenticated
  USING (cadre_id = auth.uid());

DROP POLICY IF EXISTS "Cadres create own activity attendance links" ON public.activity_attendance_links;
CREATE POLICY "Cadres create own activity attendance links"
  ON public.activity_attendance_links
  FOR INSERT TO authenticated
  WITH CHECK (cadre_id = auth.uid());

DROP POLICY IF EXISTS "Staff manage all activity attendance links" ON public.activity_attendance_links;
CREATE POLICY "Staff manage all activity attendance links"
  ON public.activity_attendance_links
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DO $$
BEGIN
  IF to_regclass('public.evidence_files') IS NOT NULL THEN
    ALTER TABLE public.evidence_files
      DROP CONSTRAINT IF EXISTS evidence_files_activity_id_fkey;

    ALTER TABLE public.evidence_files
      ADD CONSTRAINT evidence_files_activity_id_fkey
      FOREIGN KEY (activity_id)
      REFERENCES public.activities(id)
      ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.activity_approvals') IS NOT NULL THEN
    ALTER TABLE public.activity_approvals
      DROP CONSTRAINT IF EXISTS activity_approvals_activity_id_fkey;

    ALTER TABLE public.activity_approvals
      ADD CONSTRAINT activity_approvals_activity_id_fkey
      FOREIGN KEY (activity_id)
      REFERENCES public.activities(id)
      ON DELETE CASCADE;
  END IF;
END $$;

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

CREATE OR REPLACE FUNCTION public.restore_activity_attendance_from_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  IF OLD.attendance_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO v_remaining
  FROM public.activity_attendance_links
  WHERE attendance_id = OLD.attendance_id
    AND activity_id <> OLD.activity_id;

  IF v_remaining > 0 THEN
    RETURN OLD;
  END IF;

  IF OLD.previous_attendance_id IS NULL THEN
    DELETE FROM public.attendance
    WHERE id = OLD.attendance_id;
  ELSE
    UPDATE public.attendance
    SET status = OLD.previous_status,
        check_in_at = OLD.previous_check_in_at,
        check_out_at = OLD.previous_check_out_at,
        recorded_by = OLD.previous_recorded_by,
        remarks = OLD.previous_remarks,
        rejection_reason = OLD.previous_rejection_reason,
        updated_at = now()
    WHERE id = OLD.attendance_id;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_activity_attendance_from_link
  ON public.activity_attendance_links;
CREATE TRIGGER trg_restore_activity_attendance_from_link
AFTER DELETE ON public.activity_attendance_links
FOR EACH ROW
EXECUTE FUNCTION public.restore_activity_attendance_from_link();

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

DO $$
DECLARE
  v_table TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH v_table IN ARRAY ARRAY[
      'activities',
      'activity_approvals',
      'attendance',
      'evidence_files',
      'notifications',
      'profiles'
    ]
    LOOP
      IF to_regclass('public.' || v_table) IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
           FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = v_table
         ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
      END IF;
    END LOOP;
  END IF;
END $$;
