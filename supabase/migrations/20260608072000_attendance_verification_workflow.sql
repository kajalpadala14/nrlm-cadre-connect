-- Alter enum type to add 'pending_verification' status
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- Add attendance_date column to public.attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS attendance_date DATE;

-- Populate existing rows
UPDATE public.attendance SET attendance_date = date WHERE attendance_date IS NULL;

-- Create trigger function to sync 'date' and 'attendance_date' columns
CREATE OR REPLACE FUNCTION sync_attendance_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attendance_date IS NULL AND NEW.date IS NOT NULL THEN
    NEW.attendance_date := NEW.date;
  ELSIF NEW.date IS NULL AND NEW.attendance_date IS NOT NULL THEN
    NEW.date := NEW.attendance_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before insert or update
DROP TRIGGER IF EXISTS trg_sync_attendance_dates ON public.attendance;
CREATE TRIGGER trg_sync_attendance_dates
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION sync_attendance_dates();

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error'
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant Access Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Set Up RLS Policies
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
