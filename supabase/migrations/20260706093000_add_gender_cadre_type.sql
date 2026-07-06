-- Add Gender as a selectable cadre role/cadre type.

ALTER TYPE public.cadre_type ADD VALUE IF NOT EXISTS 'Gender';

NOTIFY pgrst, 'reload schema';
