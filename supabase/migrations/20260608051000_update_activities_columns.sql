-- Add new columns to public.activities table
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS panchayat text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS beneficiaries integer DEFAULT 0;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS gps text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS voice_url text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'));
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS comment text;

-- Ensure RLS policy permits Block Officers (Staff) and Admins to approve/reject activities
CREATE POLICY "Staff update all activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
