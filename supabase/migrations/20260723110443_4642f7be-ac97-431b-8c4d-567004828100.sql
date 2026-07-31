
-- Enums
CREATE TYPE public.campus AS ENUM ('UMP', 'TUT_NELSPRUIT');
CREATE TYPE public.item_type AS ENUM ('Box', 'Mini-Fridge', 'Suitcase', 'Other');
CREATE TYPE public.booking_status AS ENUM ('CONFIRMED', 'COLLECTED', 'IN_STORAGE', 'DELIVERED', 'CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');
CREATE TYPE public.payment_kind AS ENUM ('DEPOSIT', 'BALANCE', 'FULL');
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  student_number TEXT,
  campus public.campus,
  phone_number TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- profile policies
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus public.campus NOT NULL,
  collection_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  total_items INT NOT NULL DEFAULT 2 CHECK (total_items >= 1),
  total_amount NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL,
  balance_amount NUMERIC(10,2) NOT NULL,
  deposit_status public.payment_status NOT NULL DEFAULT 'PENDING',
  balance_status public.payment_status NOT NULL DEFAULT 'PENDING',
  status public.booking_status NOT NULL DEFAULT 'CONFIRMED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce Friday collection via trigger (CHECK can't use non-immutable funcs safely)
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXTRACT(DOW FROM NEW.collection_date) <> 5 THEN
    RAISE EXCEPTION 'Collection date must be a Friday';
  END IF;
  IF NEW.delivery_date <= NEW.collection_date THEN
    RAISE EXCEPTION 'Delivery date must be after collection date';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_booking
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_own_or_admin" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own_or_admin" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- booking_items
CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type public.item_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_items TO authenticated;
GRANT ALL ON public.booking_items TO service_role;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_items_select" ON public.booking_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "booking_items_insert" ON public.booking_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
  );
CREATE POLICY "booking_items_delete" ON public.booking_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- payments (audit log for PayFast)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.payment_kind NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  payfast_payment_id TEXT,
  payfast_pf_payment_id TEXT,
  raw_itn JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own_or_admin" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
