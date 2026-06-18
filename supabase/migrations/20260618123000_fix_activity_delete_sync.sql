-- Activity deletion is a hard delete flow.
-- Cadres can delete their own activities; dependent approval rows cascade.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Cadres delete own activities'
  ) THEN
    CREATE POLICY "Cadres delete own activities"
      ON public.activities
      FOR DELETE TO authenticated
      USING (cadre_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.activity_approvals') IS NOT NULL THEN
    ALTER TABLE public.activity_approvals
      DROP CONSTRAINT IF EXISTS activity_approvals_activity_id_fkey;

    ALTER TABLE public.activity_approvals
      ADD CONSTRAINT activity_approvals_activity_id_fkey
      FOREIGN KEY (activity_id)
      REFERENCES public.activities(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'activities'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END $$;
