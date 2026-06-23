-- Convert activities.activity_type from PostgreSQL enum to TEXT.
--
-- Why TEXT instead of enum:
--   The new standardized NRLM activity types are Hindi labels that cannot be
--   added to the existing English-named enum without extensive migration work.
--   TEXT is flexible, allows new values without schema changes, and existing
--   enum values cast to their text equivalents automatically (no data loss).
--
-- Backward compatibility:
--   Existing rows with values like 'SHG_Meeting', 'Farmer_Visit', etc. remain
--   unchanged. The application layer maps them to Hindi display labels via
--   LEGACY_ACTIVITY_LABEL_MAP in src/lib/activity-types.ts.

-- 1. Alter the column type from enum to text
--    PostgreSQL casts enum → text automatically; no UPDATE needed.
ALTER TABLE public.activities
  ALTER COLUMN activity_type TYPE TEXT
  USING activity_type::TEXT;

-- 2. Add a CHECK constraint to keep data meaningful.
--    We use a permissive constraint: non-empty string only.
--    This allows both old enum values and new Hindi labels.
ALTER TABLE public.activities
  ADD CONSTRAINT activities_activity_type_nonempty
  CHECK (activity_type IS NOT NULL AND length(trim(activity_type)) > 0);

-- 3. Add a text index for performance on activity_type filtering
CREATE INDEX IF NOT EXISTS idx_activities_activity_type
  ON public.activities(activity_type);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
