-- Attendance 7 PM IST automation.
-- Root cause fixed here:
--   1. Previous classification used 18:00 IST.
--   2. End-of-day absence processing only considered cadres with activities.
--   3. No database scheduler/log table guaranteed the daily batch ran.

ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'late';
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.attendance_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  target_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  marked_absent INTEGER NOT NULL DEFAULT 0,
  updated_absent INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_attendance_job_logs_target_date
  ON public.attendance_job_logs(target_date DESC, job_name);

GRANT SELECT ON public.attendance_job_logs TO authenticated;
GRANT ALL ON public.attendance_job_logs TO service_role;
ALTER TABLE public.attendance_job_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff read attendance job logs" ON public.attendance_job_logs;
CREATE POLICY "Staff read attendance job logs" ON public.attendance_job_logs
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  cadre_id UUID,
  attendance_date DATE,
  old_status public.attendance_status,
  new_status public.attendance_status,
  old_check_in_at TIMESTAMPTZ,
  new_check_in_at TIMESTAMPTZ,
  changed_by UUID,
  change_source TEXT NOT NULL DEFAULT 'database',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_logs_attendance_date
  ON public.attendance_audit_logs(attendance_date DESC, cadre_id);

GRANT SELECT ON public.attendance_audit_logs TO authenticated;
GRANT ALL ON public.attendance_audit_logs TO service_role;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff read attendance audit logs" ON public.attendance_audit_logs;
CREATE POLICY "Staff read attendance audit logs" ON public.attendance_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

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
  v_check_ts TIMESTAMPTZ;
BEGIN
  v_check_ts := COALESCE(NEW.photo_uploaded_at, NEW.check_in_at);

  IF NEW.status IN ('present', 'late') AND v_check_ts IS NOT NULL THEN
    NEW.status := public.classify_attendance_status(v_check_ts, NEW.date);
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

CREATE OR REPLACE FUNCTION public.audit_attendance_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.attendance_audit_logs (
      attendance_id,
      cadre_id,
      attendance_date,
      new_status,
      new_check_in_at,
      changed_by,
      change_source
    )
    VALUES (
      NEW.id,
      NEW.cadre_id,
      NEW.date,
      NEW.status,
      NEW.check_in_at,
      NEW.recorded_by,
      CASE WHEN NEW.recorded_by IS NULL THEN 'attendance_deadline_job' ELSE 'attendance_mark' END
    );

    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status
     OR OLD.check_in_at IS DISTINCT FROM NEW.check_in_at THEN
    INSERT INTO public.attendance_audit_logs (
      attendance_id,
      cadre_id,
      attendance_date,
      old_status,
      new_status,
      old_check_in_at,
      new_check_in_at,
      changed_by,
      change_source
    )
    VALUES (
      NEW.id,
      NEW.cadre_id,
      NEW.date,
      OLD.status,
      NEW.status,
      OLD.check_in_at,
      NEW.check_in_at,
      NEW.recorded_by,
      CASE
        WHEN OLD.status = 'absent' AND NEW.status = 'late' THEN 'late_submission_after_deadline'
        WHEN NEW.recorded_by IS NULL THEN 'attendance_deadline_job'
        ELSE 'attendance_update'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_audit_status_change ON public.attendance;
CREATE TRIGGER trg_attendance_audit_status_change
  AFTER INSERT OR UPDATE OF status, check_in_at
  ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_attendance_status_change();

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

  v_new_status := public.classify_attendance_status(v_photo.created_at, v_activity.activity_date);

  SELECT * INTO v_existing
  FROM public.attendance
  WHERE cadre_id = v_activity.cadre_id
    AND date = v_activity.activity_date
  LIMIT 1;
  v_had_existing_attendance := FOUND;

  IF v_had_existing_attendance THEN
    v_attendance_id := v_existing.id;

    UPDATE public.attendance
    SET status = CASE
          WHEN v_existing.status IN ('on_leave', 'holiday') THEN v_existing.status
          ELSE v_new_status
        END,
        photo_uploaded_at = v_photo.created_at,
        check_in_at = COALESCE(check_in_at, v_photo.created_at),
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
      SET status = CASE
            WHEN public.attendance.status IN ('on_leave', 'holiday') THEN public.attendance.status
            ELSE EXCLUDED.status
          END,
          photo_uploaded_at = EXCLUDED.photo_uploaded_at,
          check_in_at = COALESCE(public.attendance.check_in_at, EXCLUDED.check_in_at),
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

  RAISE LOG 'mark_activity_attendance: activity=%, cadre=%, date=%, status=%',
    p_activity_id, v_activity.cadre_id, v_activity.activity_date, v_new_status;

  RETURN v_attendance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_activity_attendance(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.process_end_of_day_attendance(
  p_target_date DATE DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::DATE)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_marked_absent INTEGER := 0;
  v_updated_absent INTEGER := 0;
  v_skipped INTEGER := 0;
  v_current_ist TIMESTAMP := now() AT TIME ZONE 'Asia/Kolkata';
  v_result JSONB;
BEGIN
  IF p_target_date > v_current_ist::DATE THEN
    RAISE EXCEPTION 'Cannot process attendance for a future date: %', p_target_date;
  END IF;

  IF p_target_date = v_current_ist::DATE
     AND now() < public.attendance_deadline_ist(p_target_date) THEN
    RAISE EXCEPTION 'Cannot mark absences before the 19:00 IST deadline for %', p_target_date;
  END IF;

  INSERT INTO public.attendance_job_logs (job_name, target_date)
  VALUES ('process_end_of_day_attendance', p_target_date)
  RETURNING id INTO v_job_id;

  WITH active_cadres AS (
    SELECT DISTINCT
      p.id AS cadre_id,
      p.block_id
    FROM public.profiles p
    JOIN public.user_roles ur
      ON ur.user_id = p.id
     AND ur.role = 'cadre'
    WHERE COALESCE(lower(p.status), 'active') NOT IN ('inactive', 'disabled', 'deactivated')
  ),
  upserted AS (
    INSERT INTO public.attendance (
      cadre_id,
      block_id,
      date,
      attendance_date,
      status,
      recorded_by,
      remarks
    )
    SELECT
      ac.cadre_id,
      ac.block_id,
      p_target_date,
      p_target_date,
      'absent',
      NULL,
      'Auto-marked absent after 19:00 IST deadline'
    FROM active_cadres ac
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = 'absent',
          block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          remarks = COALESCE(public.attendance.remarks, EXCLUDED.remarks),
          updated_at = now()
    WHERE public.attendance.status NOT IN ('present', 'late', 'on_leave', 'holiday')
    RETURNING (xmax = 0) AS inserted
  )
  SELECT
    COUNT(*) FILTER (WHERE inserted),
    COUNT(*) FILTER (WHERE NOT inserted)
  INTO v_marked_absent, v_updated_absent
  FROM upserted;

  SELECT COUNT(*) INTO v_skipped
  FROM public.attendance
  WHERE date = p_target_date
    AND status IN ('present', 'late', 'on_leave', 'holiday');

  v_result := jsonb_build_object(
    'target_date', p_target_date,
    'timezone', 'Asia/Kolkata',
    'deadline', '19:00',
    'marked_absent', COALESCE(v_marked_absent, 0),
    'updated_to_absent', COALESCE(v_updated_absent, 0),
    'skipped_existing_valid_status', COALESCE(v_skipped, 0)
  );

  UPDATE public.attendance_job_logs
  SET finished_at = now(),
      status = 'success',
      marked_absent = COALESCE(v_marked_absent, 0),
      updated_absent = COALESCE(v_updated_absent, 0),
      skipped = COALESCE(v_skipped, 0),
      details = v_result
  WHERE id = v_job_id;

  RAISE LOG 'process_end_of_day_attendance success: %', v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  IF v_job_id IS NOT NULL THEN
    UPDATE public.attendance_job_logs
    SET finished_at = now(),
        status = 'failed',
        error_message = SQLERRM
    WHERE id = v_job_id;
  END IF;

  RAISE LOG 'process_end_of_day_attendance failed for %: %', p_target_date, SQLERRM;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_end_of_day_attendance(DATE) TO service_role;

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be created automatically: %', SQLERRM;
  END;

  IF to_regnamespace('cron') IS NOT NULL THEN
    BEGIN
      PERFORM cron.unschedule('process-daily-attendance-7pm-ist');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Existing attendance cron job was not present or could not be unscheduled: %', SQLERRM;
    END;

    PERFORM cron.schedule(
      'process-daily-attendance-7pm-ist',
      '35 13 * * *',
      $cron$SELECT public.process_end_of_day_attendance((now() AT TIME ZONE 'Asia/Kolkata')::DATE);$cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron is unavailable. Schedule SELECT public.process_end_of_day_attendance(...) daily at 19:05 Asia/Kolkata from an external scheduler.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Attendance cron schedule was not installed automatically: %', SQLERRM;
END;
$$;

NOTIFY pgrst, 'reload schema';
