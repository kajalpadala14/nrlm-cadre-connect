-- Backfill past non-Sunday absences.
--
-- The daily cron handles future days, but historical dates that were missed by
-- earlier scheduler versions still need explicit rows. This keeps Sunday as a
-- weekly off day, respects approved leave, and avoids marking a cadre absent
-- before their join_date.

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
  v_sunday_holidays INTEGER := 0;
  v_current_ist TIMESTAMP := now() AT TIME ZONE 'Asia/Kolkata';
  v_result JSONB;
BEGIN
  IF p_target_date > v_current_ist::DATE THEN
    RAISE EXCEPTION 'Cannot process attendance for a future date: %', p_target_date;
  END IF;

  INSERT INTO public.attendance_job_logs (job_name, target_date)
  VALUES ('process_end_of_day_attendance', p_target_date)
  RETURNING id INTO v_job_id;

  IF EXTRACT(ISODOW FROM p_target_date) = 7 THEN
    UPDATE public.attendance
    SET status = 'holiday',
        remarks = COALESCE(NULLIF(remarks, ''), 'Sunday weekly off'),
        updated_at = now()
    WHERE date = p_target_date
      AND status = 'absent';

    GET DIAGNOSTICS v_sunday_holidays = ROW_COUNT;

    SELECT COUNT(*) INTO v_skipped
    FROM public.attendance
    WHERE date = p_target_date
      AND status IN ('present', 'late', 'on_leave', 'holiday');

    v_result := jsonb_build_object(
      'target_date', p_target_date,
      'timezone', 'Asia/Kolkata',
      'weekly_off', 'Sunday',
      'marked_absent', 0,
      'updated_to_absent', 0,
      'converted_absent_to_holiday', COALESCE(v_sunday_holidays, 0),
      'skipped_existing_valid_status', COALESCE(v_skipped, 0)
    );

    UPDATE public.attendance_job_logs
    SET finished_at = now(),
        status = 'success',
        marked_absent = 0,
        updated_absent = 0,
        skipped = COALESCE(v_skipped, 0),
        details = v_result
    WHERE id = v_job_id;

    RAISE LOG 'process_end_of_day_attendance skipped Sunday: %', v_result;
    RETURN v_result;
  END IF;

  IF p_target_date = v_current_ist::DATE
     AND now() < public.attendance_deadline_ist(p_target_date) THEN
    RAISE EXCEPTION 'Cannot mark absences before the 19:00 IST deadline for %', p_target_date;
  END IF;

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
      AND (p.join_date IS NULL OR p.join_date <= p_target_date)
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

  RAISE LOG 'process_end_of_day_attendance backfill-aware success: %', v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  IF v_job_id IS NOT NULL THEN
    UPDATE public.attendance_job_logs
    SET finished_at = now(),
        status = 'failed',
        error_message = SQLERRM
    WHERE id = v_job_id;
  END IF;

  RAISE LOG 'process_end_of_day_attendance backfill-aware failed for %: %', p_target_date, SQLERRM;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_end_of_day_attendance(DATE) TO service_role;

CREATE OR REPLACE FUNCTION public.backfill_attendance_absences(
  p_start_date DATE,
  p_end_date DATE DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::DATE - 1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
  v_processed INTEGER := 0;
  v_sundays_skipped INTEGER := 0;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
  v_current_ist TIMESTAMP := now() AT TIME ZONE 'Asia/Kolkata';
  v_effective_end DATE;
BEGIN
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'Start date is required';
  END IF;

  v_effective_end := LEAST(p_end_date, v_current_ist::DATE);

  IF v_effective_end = v_current_ist::DATE
     AND now() < public.attendance_deadline_ist(v_effective_end) THEN
    v_effective_end := v_effective_end - 1;
  END IF;

  IF p_start_date > v_effective_end THEN
    RETURN jsonb_build_object(
      'start_date', p_start_date,
      'end_date', v_effective_end,
      'processed_dates', 0,
      'sundays_skipped', 0,
      'results', v_results
    );
  END IF;

  v_date := p_start_date;
  WHILE v_date <= v_effective_end LOOP
    IF EXTRACT(ISODOW FROM v_date) = 7 THEN
      PERFORM public.process_end_of_day_attendance(v_date);
      v_sundays_skipped := v_sundays_skipped + 1;
    ELSE
      v_result := public.process_end_of_day_attendance(v_date);
      v_results := v_results || jsonb_build_array(v_result);
      v_processed := v_processed + 1;
    END IF;

    v_date := v_date + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'start_date', p_start_date,
    'end_date', v_effective_end,
    'processed_dates', v_processed,
    'sundays_skipped', v_sundays_skipped,
    'results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_attendance_absences(DATE, DATE) TO service_role;

DO $$
DECLARE
  v_start_date DATE;
  v_end_date DATE := ((now() AT TIME ZONE 'Asia/Kolkata')::DATE - 1);
  v_result JSONB;
BEGIN
  SELECT MIN(p.join_date)
  INTO v_start_date
  FROM public.profiles p
  JOIN public.user_roles ur
    ON ur.user_id = p.id
   AND ur.role = 'cadre'
  WHERE p.join_date IS NOT NULL;

  v_start_date := GREATEST(COALESCE(v_start_date, v_end_date - 45), DATE '2026-06-01');

  IF v_start_date <= v_end_date THEN
    v_result := public.backfill_attendance_absences(v_start_date, v_end_date);
    RAISE LOG 'backfill_past_non_sunday_absences completed: %', v_result;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
