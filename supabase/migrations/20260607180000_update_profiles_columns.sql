-- Add new fields for Cadre management to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS panchayat text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS join_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
