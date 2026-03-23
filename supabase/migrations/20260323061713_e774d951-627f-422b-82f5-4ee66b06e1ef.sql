
-- Create app_roles table
CREATE TABLE public.app_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'hsl(217, 91%, 60%)',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(role_id, module)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role_id UUID REFERENCES public.app_roles(id),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.get_user_role_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name FROM public.app_roles r
  JOIN public.profiles p ON p.role_id = r.id
  WHERE p.id = p_user_id
$$;

-- RLS policies for app_roles (all authenticated can read, only admins can modify)
CREATE POLICY "Anyone can view roles" ON public.app_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.app_roles FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');
CREATE POLICY "Admins can update roles" ON public.app_roles FOR UPDATE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');
CREATE POLICY "Admins can delete roles" ON public.app_roles FOR DELETE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');

-- RLS policies for role_permissions
CREATE POLICY "Anyone can view permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert permissions" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');
CREATE POLICY "Admins can update permissions" ON public.role_permissions FOR UPDATE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');
CREATE POLICY "Admins can delete permissions" ON public.role_permissions FOR DELETE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');

-- RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin' OR id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.get_user_role_name(auth.uid()) = 'Admin');

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed default roles
INSERT INTO public.app_roles (name, description, color, is_default) VALUES
  ('Admin', 'Full system access with all permissions', 'hsl(var(--primary))', true),
  ('Doctor', 'Medical records, prescriptions, patient care', 'hsl(217, 91%, 60%)', false),
  ('Nurse', 'Patient vitals, injections, basic care', 'hsl(142, 71%, 45%)', false),
  ('Receptionist', 'Patient registration, billing, appointments', 'hsl(270, 60%, 55%)', false),
  ('Lab Technician', 'Lab tests, sample collection, reports', 'hsl(45, 93%, 47%)', false),
  ('Pharmacist', 'Medicine inventory, dispensing', 'hsl(190, 80%, 45%)', false);

-- Seed permissions for all roles and modules
DO $$
DECLARE
  v_role RECORD;
  v_module TEXT;
  v_modules TEXT[] := ARRAY[
    'Dashboard', 'Billing', 'OPD Section', 'Prescriptions', 'Health Services',
    'Health Packages', 'Injections', 'Lab Tests', 'Lab Reports', 'Sample Collection',
    'Test Names', 'X-Ray', 'Ultrasound', 'Doctors', 'Medicine', 'Roles',
    'Refund', 'Due Management', 'Expenses', 'Bank Transactions', 'Investments',
    'System Manage', 'Settings', 'Users & Access'
  ];
BEGIN
  FOR v_role IN SELECT id, name FROM public.app_roles LOOP
    FOREACH v_module IN ARRAY v_modules LOOP
      IF v_role.name = 'Admin' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module, true, true, true, true);
      ELSIF v_role.name = 'Doctor' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module,
          v_module IN ('OPD Section','Prescriptions','Health Services','Health Packages','Injections','Lab Tests','Lab Reports','Dashboard','Medicine','Doctors'),
          v_module IN ('OPD Section','Prescriptions','Health Services','Health Packages','Injections','Lab Tests','Lab Reports'),
          v_module IN ('OPD Section','Prescriptions','Health Services','Health Packages','Injections','Lab Tests','Lab Reports'),
          false);
      ELSIF v_role.name = 'Nurse' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module,
          v_module IN ('OPD Section','Injections','Dashboard','Prescriptions','Health Services'),
          v_module IN ('OPD Section','Injections'),
          v_module IN ('OPD Section','Injections'),
          false);
      ELSIF v_role.name = 'Receptionist' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module,
          v_module IN ('OPD Section','Billing','Due Management','Dashboard','Prescriptions','Refund'),
          v_module IN ('OPD Section','Billing','Due Management'),
          v_module IN ('OPD Section','Billing','Due Management'),
          false);
      ELSIF v_role.name = 'Lab Technician' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module,
          v_module IN ('Lab Tests','Lab Reports','Sample Collection','Test Names','Dashboard','X-Ray','Ultrasound'),
          v_module IN ('Lab Tests','Lab Reports','Sample Collection','Test Names'),
          v_module IN ('Lab Tests','Lab Reports','Sample Collection','Test Names'),
          false);
      ELSIF v_role.name = 'Pharmacist' THEN
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module,
          v_module IN ('Medicine','Dashboard','Prescriptions','Billing'),
          v_module IN ('Medicine'),
          v_module IN ('Medicine'),
          v_module IN ('Medicine'));
      ELSE
        INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (v_role.id, v_module, false, false, false, false);
      END IF;
    END LOOP;
  END LOOP;
END $$;
