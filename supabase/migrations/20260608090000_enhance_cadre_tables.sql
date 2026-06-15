-- Add emergency contact details, training status, and photo URL to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_status TEXT DEFAULT 'Not Started';

-- Add rejection/verification remarks to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create Tickets table for Help & Support tickets tracking
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadre_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'resolved', 'closed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant Access Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Set Up RLS Policies for tickets
CREATE POLICY "Users read own tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (cadre_id = auth.uid());

CREATE POLICY "Users insert own tickets" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (cadre_id = auth.uid());

CREATE POLICY "Staff manage all tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Create Profile Photos Storage Bucket (if not already exists)
-- Note: In Supabase, bucket creation can be handled via client code or SQL.
-- Let's make sure it is safe.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Grant storage permissions to authenticated users for profile-photos
CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-photos');
