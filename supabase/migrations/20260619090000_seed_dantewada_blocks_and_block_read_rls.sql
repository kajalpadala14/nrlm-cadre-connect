-- Restore block master visibility for cadre submissions and seed Dantewada blocks.

ALTER TABLE public.blocks
  ADD COLUMN IF NOT EXISTS district_name TEXT;

UPDATE public.blocks
SET district_name = 'Dantewada'
WHERE name IN ('Dantewada', 'Geedam', 'Katekalyan', 'Kuwakonda');

INSERT INTO public.blocks (name, district_name)
VALUES
  ('Dantewada', 'Dantewada'),
  ('Geedam', 'Dantewada'),
  ('Katekalyan', 'Dantewada'),
  ('Kuwakonda', 'Dantewada')
ON CONFLICT (name) DO UPDATE
SET district_name = EXCLUDED.district_name;

DROP POLICY IF EXISTS "Authenticated users read block master" ON public.blocks;
CREATE POLICY "Authenticated users read block master" ON public.blocks
  FOR SELECT TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
