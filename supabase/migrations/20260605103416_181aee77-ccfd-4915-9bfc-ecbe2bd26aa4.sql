
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'block_officer', 'cadre');
CREATE TYPE public.cadre_type AS ENUM ('PRP', 'FLCRP', 'RBK', 'IFC_Anchor', 'SR_CRP');
CREATE TYPE public.activity_type AS ENUM (
  'SHG_Meeting',
  'Farmer_Visit',
  'Training_Session',
  'Monitoring_Visit',
  'Record_Verification',
  'Livelihood_Activity',
  'Other'
);

-- BLOCKS
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cadre_type public.cadre_type,
  block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','block_officer')
  );
$$;

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadre_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  village_name TEXT NOT NULL,
  activity_type public.activity_type NOT NULL,
  description TEXT,
  photo_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activities_cadre_date_idx ON public.activities(cadre_id, activity_date DESC);
CREATE INDEX activities_date_idx ON public.activities(activity_date DESC);
CREATE INDEX activities_block_idx ON public.activities(block_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- POLICIES: blocks
CREATE POLICY "Authenticated can read blocks" ON public.blocks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage blocks" ON public.blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- POLICIES: profiles
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Staff read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- POLICIES: user_roles
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- POLICIES: activities
CREATE POLICY "Cadres read own activities" ON public.activities
  FOR SELECT TO authenticated USING (cadre_id = auth.uid());
CREATE POLICY "Staff read all activities" ON public.activities
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Cadres insert own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (cadre_id = auth.uid());
CREATE POLICY "Cadres update own activities" ON public.activities
  FOR UPDATE TO authenticated USING (cadre_id = auth.uid()) WITH CHECK (cadre_id = auth.uid());
CREATE POLICY "Admins manage activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few default blocks
INSERT INTO public.blocks (name) VALUES ('Block A'), ('Block B'), ('Block C')
ON CONFLICT (name) DO NOTHING;
