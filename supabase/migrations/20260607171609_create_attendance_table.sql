-- Create Attendance Status Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'on_leave', 'holiday');
  END IF;
END $$;

-- Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadre_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'absent',
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure a cadre has at most one attendance record per day
  CONSTRAINT unique_cadre_date UNIQUE (cadre_id, date)
);

-- Grant Access Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Set Up RLS Policies
CREATE POLICY "Cadres read own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (cadre_id = auth.uid());

CREATE POLICY "Staff read all attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Cadres insert own attendance" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (cadre_id = auth.uid());

CREATE POLICY "Cadres update own attendance" ON public.attendance
  FOR UPDATE TO authenticated
  USING (cadre_id = auth.uid())
  WITH CHECK (cadre_id = auth.uid());

CREATE POLICY "Staff manage all attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_cadre_date ON public.attendance(cadre_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_block ON public.attendance(block_id);

-- Set Up updated_at Trigger
CREATE OR REPLACE TRIGGER trg_attendance_updated
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
