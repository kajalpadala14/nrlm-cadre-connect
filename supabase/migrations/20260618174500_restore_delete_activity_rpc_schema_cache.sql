-- Restore and expose the activity deletion RPC for PostgREST.
-- This migration is intentionally small so production can pick it up even if
-- the schema cache missed the previous definition.

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

GRANT EXECUTE ON FUNCTION public.delete_activity_with_consistency(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_activity_with_consistency(UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
