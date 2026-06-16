-- Create the activity-photos storage bucket if it doesn't already exist.
-- This bucket was referenced in storage RLS policies but never explicitly created.
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-photos', 'activity-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure policies exist (idempotent — skip if already created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Cadres upload own photos'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Cadres upload own photos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'activity-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Cadres read own photos'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Cadres read own photos"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'activity-photos'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR public.is_staff(auth.uid())
        )
      )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Cadres delete own photos'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Cadres delete own photos"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'activity-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    $pol$;
  END IF;
END
$$;
