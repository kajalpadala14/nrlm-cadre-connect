-- Standardize existing village names so village coverage metrics do not split
-- common Hindi/English/spelling variants into separate villages.

CREATE OR REPLACE FUNCTION public.standardize_village_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_key text;
BEGIN
  v_clean := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  IF v_clean = '' THEN
    RETURN NULL;
  END IF;

  v_key := lower(
    btrim(
      regexp_replace(
        regexp_replace(v_clean, '[\.,''`"’‘“”\(\)\[\]\{\}_-]+', ' ', 'g'),
        '\s+',
        ' ',
        'g'
      )
    )
  );

  IF v_key IN (
    'dantewada',
    'dantewara',
    'dantevada',
    'dantewadaa',
    'dantewad',
    'dntewada',
    'dantewada cg',
    'dantewada chhattisgarh',
    'dantewada village',
    'दंतेवाड़ा',
    'दंतेवाडा',
    'दन्तेवाड़ा',
    'दन्तेवाडा'
  ) THEN
    RETURN 'Dantewada';
  END IF;

  RETURN initcap(v_key);
END;
$$;

UPDATE public.activities
SET village_name = public.standardize_village_name(village_name)
WHERE village_name IS NOT NULL
  AND village_name IS DISTINCT FROM public.standardize_village_name(village_name);

UPDATE public.profiles
SET village = public.standardize_village_name(village)
WHERE village IS NOT NULL
  AND village IS DISTINCT FROM public.standardize_village_name(village);
