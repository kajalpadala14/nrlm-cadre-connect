-- Ensure FPO CEO is accepted as a cadre type in every deployed database.
ALTER TYPE public.cadre_type ADD VALUE IF NOT EXISTS 'FPO_CEO';
