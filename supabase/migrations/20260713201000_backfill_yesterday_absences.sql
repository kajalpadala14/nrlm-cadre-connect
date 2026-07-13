-- One-time catch-up for the day before this production fix is applied.
-- The daily cron handles future dates, but yesterday may already have missed
-- the 19:00 IST job when the fix is deployed.

DO $$
DECLARE
  v_target_date DATE := ((now() AT TIME ZONE 'Asia/Kolkata')::DATE - 1);
  v_result JSONB;
BEGIN
  v_result := public.process_end_of_day_attendance(v_target_date);
  RAISE LOG 'backfill_yesterday_absences processed %: %', v_target_date, v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'backfill_yesterday_absences failed for %: %', v_target_date, SQLERRM;
  RAISE;
END;
$$;

NOTIFY pgrst, 'reload schema';
