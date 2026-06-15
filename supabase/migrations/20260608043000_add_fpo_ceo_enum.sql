-- Add FPO_CEO to the public.cadre_type enum
ALTER TYPE public.cadre_type ADD VALUE IF NOT EXISTS 'FPO_CEO';
