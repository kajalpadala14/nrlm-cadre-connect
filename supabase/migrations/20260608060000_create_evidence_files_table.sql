-- Create evidence_files table
CREATE TABLE IF NOT EXISTS public.evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  cadre_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant Access Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_files TO authenticated;
GRANT ALL ON public.evidence_files TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;

-- Set Up RLS Policies
CREATE POLICY "Cadres read own evidence files" ON public.evidence_files
  FOR SELECT TO authenticated
  USING (cadre_id = auth.uid());

CREATE POLICY "Staff read all evidence files" ON public.evidence_files
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Cadres insert own evidence files" ON public.evidence_files
  FOR INSERT TO authenticated
  WITH CHECK (cadre_id = auth.uid());

CREATE POLICY "Cadres delete own evidence files" ON public.evidence_files
  FOR DELETE TO authenticated
  USING (cadre_id = auth.uid());

CREATE POLICY "Staff manage all evidence files" ON public.evidence_files
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_files_activity ON public.evidence_files(activity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_cadre ON public.evidence_files(cadre_id);
