-- Align cadre administrative location fields with application validation.
-- These columns were already text; this migration documents and enforces
-- the expanded 500-character limit used by the frontend and server.

ALTER TABLE public.profiles
  ALTER COLUMN village TYPE text,
  ALTER COLUMN panchayat TYPE text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_village_length_check,
  DROP CONSTRAINT IF EXISTS profiles_panchayat_length_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_village_length_check
    CHECK (village IS NULL OR char_length(btrim(village)) <= 500),
  ADD CONSTRAINT profiles_panchayat_length_check
    CHECK (panchayat IS NULL OR char_length(btrim(panchayat)) <= 500);
