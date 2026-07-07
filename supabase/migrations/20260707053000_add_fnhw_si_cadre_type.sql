-- Add FNHW and SI to the public.cadre_type enum
-- These allow Field Officers (FNHW/SI) to be registered as cadres
-- with their specific role type stored in the cadre_type column.
ALTER TYPE public.cadre_type ADD VALUE IF NOT EXISTS 'FNHW';
ALTER TYPE public.cadre_type ADD VALUE IF NOT EXISTS 'SI';
