-- Add foreign key constraint from public.activities.cadre_id to public.profiles.id
-- to enable PostgREST to automatically resolve joins on profiles
ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_cadre_id_fkey;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_cadre_id_fkey_profiles
  FOREIGN KEY (cadre_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;
