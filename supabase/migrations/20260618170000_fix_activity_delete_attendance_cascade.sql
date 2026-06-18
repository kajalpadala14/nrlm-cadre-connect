-- Fix activity deletion so auto-generated attendance is reversed even for
-- legacy rows created before activity_attendance_links existed.

CREATE OR REPLACE FUNCTION public.reverse_activity_attendance(
  p_activity_id UUID,
  p_cadre_id UUID,
  p_activity_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.activity_attendance_links%ROWTYPE;
  v_other_activity_count INTEGER := 0;
  v_attendance public.attendance%ROWTYPE;
BEGIN
  SELECT * INTO v_link
  FROM public.activity_attendance_links
  WHERE activity_id = p_activity_id
  LIMIT 1;

  IF FOUND THEN
    DELETE FROM public.activity_attendance_links
    WHERE activity_id = p_activity_id;
    RETURN;
  END IF;

  -- Legacy fallback: older auto-attendance was written directly to attendance
  -- with recorded_by = cadre_id and no activity source link. Only remove it when
  -- this is the last activity for the cadre/date.
  SELECT COUNT(*) INTO v_other_activity_count
  FROM public.activities
  WHERE cadre_id = p_cadre_id
    AND activity_date = p_activity_date
    AND id <> p_activity_id;

  IF v_other_activity_count > 0 THEN
    RETURN;
  END IF;

  SELECT * INTO v_attendance
  FROM public.attendance
  WHERE cadre_id = p_cadre_id
    AND date = p_activity_date
    AND status = 'present'
    AND recorded_by = p_cadre_id
  LIMIT 1;

  IF FOUND THEN
    DELETE FROM public.attendance
    WHERE id = v_attendance.id;
  END IF;
END;
$$;

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
     AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to delete this activity';
  END IF;

  PERFORM public.reverse_activity_attendance(
    v_activity.id,
    v_activity.cadre_id,
    v_activity.activity_date
  );

  DELETE FROM public.activities
  WHERE id = p_activity_id;
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'activity_attendance_links'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_attendance_links;
  END IF;
END $$;
