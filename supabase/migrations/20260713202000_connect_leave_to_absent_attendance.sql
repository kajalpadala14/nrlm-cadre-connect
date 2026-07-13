-- Connect approved leaves to automated attendance absence handling.
--
-- If a cadre has an approved leave covering a date, that date must show
-- on_leave, not absent. This migration backfills existing approved leave dates
-- and makes the daily absence job leave-aware.

CREATE OR REPLACE FUNCTION public.sync_approved_leave_to_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date DATE;
  v_block_id UUID;
BEGIN
  IF NEW.status = 'approved' THEN
    SELECT COALESCE(NEW.block_id, p.block_id)
    INTO v_block_id
    FROM public.profiles p
    WHERE p.id = NEW.cadre_id;

    v_current_date := NEW.from_date;

    WHILE v_current_date <= NEW.to_date LOOP
      INSERT INTO public.attendance (
        cadre_id,
        block_id,
        date,
        attendance_date,
        status,
        recorded_by,
        remarks,
        created_at,
        updated_at
      )
      VALUES (
        NEW.cadre_id,
        v_block_id,
        v_current_date,
        v_current_date,
        'on_leave',
        NEW.approved_by,
        'Approved Leave (' || NEW.leave_type || ') - Reason: ' || COALESCE(NEW.reason, ''),
        now(),
        now()
      )
      ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = 'on_leave',
          block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          remarks = EXCLUDED.remarks,
          recorded_by = COALESCE(EXCLUDED.recorded_by, public.attendance.recorded_by),
          updated_at = now();

      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_approved_leave_to_attendance ON public.leave_requests;
CREATE TRIGGER trg_sync_approved_leave_to_attendance
  AFTER INSERT OR UPDATE OF status, from_date, to_date, cadre_id, block_id
  ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_leave_to_attendance();

WITH approved_leave_days AS (
  SELECT
    lr.cadre_id,
    COALESCE(lr.block_id, p.block_id) AS block_id,
    lr.leave_type,
    lr.reason,
    lr.approved_by,
    day::DATE AS leave_date
  FROM public.leave_requests lr
  LEFT JOIN public.profiles p ON p.id = lr.cadre_id
  CROSS JOIN LATERAL generate_series(lr.from_date, lr.to_date, INTERVAL '1 day') AS day
  WHERE lr.status = 'approved'
)
INSERT INTO public.attendance (
  cadre_id,
  block_id,
  date,
  attendance_date,
  status,
  recorded_by,
  remarks,
  created_at,
  updated_at
)
SELECT
  cadre_id,
  block_id,
  leave_date,
  leave_date,
  'on_leave',
  approved_by,
  'Approved Leave (' || leave_type || ') - Reason: ' || COALESCE(reason, ''),
  now(),
  now()
FROM approved_leave_days
ON CONFLICT (cadre_id, date) DO UPDATE
SET status = 'on_leave',
    block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
    remarks = EXCLUDED.remarks,
    recorded_by = COALESCE(EXCLUDED.recorded_by, public.attendance.recorded_by),
    updated_at = now();

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
  v_marked_leave INTEGER := 0;
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

  WITH approved_leaves AS (
    SELECT DISTINCT
      lr.cadre_id,
      COALESCE(lr.block_id, p.block_id) AS block_id,
      lr.leave_type,
      lr.reason,
      lr.approved_by
    FROM public.leave_requests lr
    LEFT JOIN public.profiles p ON p.id = lr.cadre_id
    WHERE lr.status = 'approved'
      AND lr.from_date <= p_target_date
      AND lr.to_date >= p_target_date
  ),
  upserted_leaves AS (
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
      al.cadre_id,
      al.block_id,
      p_target_date,
      p_target_date,
      'on_leave',
      al.approved_by,
      'Approved Leave (' || al.leave_type || ') - Reason: ' || COALESCE(al.reason, '')
    FROM approved_leaves al
    ON CONFLICT (cadre_id, date) DO UPDATE
      SET status = 'on_leave',
          block_id = COALESCE(public.attendance.block_id, EXCLUDED.block_id),
          remarks = EXCLUDED.remarks,
          recorded_by = COALESCE(EXCLUDED.recorded_by, public.attendance.recorded_by),
          updated_at = now()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_marked_leave
  FROM upserted_leaves;

  WITH active_cadres AS (
    SELECT DISTINCT
      p.id AS cadre_id,
      p.block_id
    FROM public.profiles p
    JOIN public.user_roles ur
      ON ur.user_id = p.id
     AND ur.role = 'cadre'
    WHERE COALESCE(lower(p.status), 'active') NOT IN ('inactive', 'disabled', 'deactivated')
      AND NOT EXISTS (
        SELECT 1
        FROM public.leave_requests lr
        WHERE lr.cadre_id = p.id
          AND lr.status = 'approved'
          AND lr.from_date <= p_target_date
          AND lr.to_date >= p_target_date
      )
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
    'marked_on_leave', COALESCE(v_marked_leave, 0),
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

  RAISE LOG 'process_end_of_day_attendance leave-aware success: %', v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  IF v_job_id IS NOT NULL THEN
    UPDATE public.attendance_job_logs
    SET finished_at = now(),
        status = 'failed',
        error_message = SQLERRM
    WHERE id = v_job_id;
  END IF;

  RAISE LOG 'process_end_of_day_attendance leave-aware failed for %: %', p_target_date, SQLERRM;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_end_of_day_attendance(DATE) TO service_role;

NOTIFY pgrst, 'reload schema';
