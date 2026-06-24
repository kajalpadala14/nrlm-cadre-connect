-- Merge duplicate block definitions and associate profiles/activities/attendance/leaves correctly.

DO $$
DECLARE
  v_geedam_hindi_id UUID;
  v_geedam_eng_id UUID;
  v_katekalyan_hindi_id UUID;
  v_katekalyan_eng_id UUID;
  v_kuwakonda_hindi_id UUID;
  v_kuwakonda_eng_id UUID;
BEGIN
  -- Geedam
  SELECT id INTO v_geedam_hindi_id FROM public.blocks WHERE name = 'Geedam (गीदम)';
  SELECT id INTO v_geedam_eng_id FROM public.blocks WHERE name = 'Geedam';
  
  IF v_geedam_hindi_id IS NOT NULL AND v_geedam_eng_id IS NOT NULL THEN
    UPDATE public.profiles SET block_id = v_geedam_hindi_id WHERE block_id = v_geedam_eng_id;
    UPDATE public.activities SET block_id = v_geedam_hindi_id WHERE block_id = v_geedam_eng_id;
    UPDATE public.attendance SET block_id = v_geedam_hindi_id WHERE block_id = v_geedam_eng_id;
    UPDATE public.leave_requests SET block_id = v_geedam_hindi_id WHERE block_id = v_geedam_eng_id;
    DELETE FROM public.blocks WHERE id = v_geedam_eng_id;
  END IF;

  -- Katekalyan
  SELECT id INTO v_katekalyan_hindi_id FROM public.blocks WHERE name = 'Katekalyan (कटेकल्याण)';
  SELECT id INTO v_katekalyan_eng_id FROM public.blocks WHERE name = 'Katekalyan';
  
  IF v_katekalyan_hindi_id IS NOT NULL AND v_katekalyan_eng_id IS NOT NULL THEN
    UPDATE public.profiles SET block_id = v_katekalyan_hindi_id WHERE block_id = v_katekalyan_eng_id;
    UPDATE public.activities SET block_id = v_katekalyan_hindi_id WHERE block_id = v_katekalyan_eng_id;
    UPDATE public.attendance SET block_id = v_katekalyan_hindi_id WHERE block_id = v_katekalyan_eng_id;
    UPDATE public.leave_requests SET block_id = v_katekalyan_hindi_id WHERE block_id = v_katekalyan_eng_id;
    DELETE FROM public.blocks WHERE id = v_katekalyan_eng_id;
  END IF;

  -- Kuwakonda
  SELECT id INTO v_kuwakonda_hindi_id FROM public.blocks WHERE name = 'Kuwakonda (कुआकोंडा)';
  SELECT id INTO v_kuwakonda_eng_id FROM public.blocks WHERE name = 'Kuwakonda';
  
  IF v_kuwakonda_hindi_id IS NOT NULL AND v_kuwakonda_eng_id IS NOT NULL THEN
    UPDATE public.profiles SET block_id = v_kuwakonda_hindi_id WHERE block_id = v_kuwakonda_eng_id;
    UPDATE public.activities SET block_id = v_kuwakonda_hindi_id WHERE block_id = v_kuwakonda_eng_id;
    UPDATE public.attendance SET block_id = v_kuwakonda_hindi_id WHERE block_id = v_kuwakonda_eng_id;
    UPDATE public.leave_requests SET block_id = v_kuwakonda_hindi_id WHERE block_id = v_kuwakonda_eng_id;
    DELETE FROM public.blocks WHERE id = v_kuwakonda_eng_id;
  END IF;

  -- Ensure district_name is set for all of them so they filter correctly by district
  UPDATE public.blocks 
  SET district_name = 'Dantewada' 
  WHERE name IN ('Geedam (गीदम)', 'Katekalyan (कटेकल्याण)', 'Kuwakonda (कुआकोंडा)', 'Dantewada');
END $$;
