-- Add FNHW and SI as block-scoped staff roles with BPM/Block Officer access.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fnhw';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'si';

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'block_officer', 'fnhw', 'si')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_block(_user_id UUID, _block_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(_user_id)
    OR (
      public.is_staff(_user_id)
      AND NOT public.is_admin(_user_id)
      AND _block_id IS NOT NULL
      AND _block_id = public.user_block_id(_user_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_profile(_user_id UUID, _profile_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _profile_id = _user_id
    OR public.is_admin(_user_id)
    OR (
      public.is_staff(_user_id)
      AND NOT public.is_admin(_user_id)
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = _profile_id
          AND p.block_id = public.user_block_id(_user_id)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_block(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_profile(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Block officers read assigned block" ON public.blocks;
CREATE POLICY "Block officers read assigned block" ON public.blocks
  FOR SELECT TO authenticated
  USING (public.can_access_block(auth.uid(), id));

DROP POLICY IF EXISTS "Block officers read assigned block profiles" ON public.profiles;
CREATE POLICY "Block officers read assigned block profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    AND NOT public.is_admin(auth.uid())
    AND public.can_access_profile(auth.uid(), id)
  );

DROP POLICY IF EXISTS "Block officers read assigned block roles" ON public.user_roles;
CREATE POLICY "Block officers read assigned block roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    AND NOT public.is_admin(auth.uid())
    AND public.can_access_profile(auth.uid(), user_id)
  );

CREATE OR REPLACE FUNCTION public.notify_new_leave_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cadre_name TEXT;
BEGIN
  SELECT full_name INTO v_cadre_name
  FROM public.profiles
  WHERE id = NEW.cadre_id;

  INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
  SELECT
    p.id,
    'नया अवकाश अनुरोध / New Leave Request Received',
    'कैडर ' || COALESCE(v_cadre_name, 'Unknown') || ' ने ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' से ' || to_char(NEW.to_date, 'YYYY-MM-DD') || ' तक अवकाश के लिए आवेदन किया है। / Cadre ' || COALESCE(v_cadre_name, 'Unknown') || ' has applied for leave from ' || to_char(NEW.from_date, 'YYYY-MM-DD') || ' to ' || to_char(NEW.to_date, 'YYYY-MM-DD') || '.',
    'info',
    false,
    now()
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.block_id = NEW.block_id
    AND ur.role::text IN ('block_officer', 'fnhw', 'si');

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
