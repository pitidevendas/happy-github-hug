-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('consultant', 'business_owner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'business_owner',
  company_name TEXT,
  segment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dashboard_data table to store all dashboard data as JSONB
CREATE TABLE public.dashboard_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT 'Minha Empresa',
  business_segment TEXT NOT NULL DEFAULT 'Varejo',
  custom_logo_url TEXT,
  app_settings JSONB DEFAULT '{"aggressiveMode": false, "considerVacation": false}',
  kpis JSONB NOT NULL DEFAULT '{}',
  historical_data JSONB NOT NULL DEFAULT '[]',
  current_year_data JSONB NOT NULL DEFAULT '[]',
  team JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create invites table for consultant invitations
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'business_owner',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered')),
  registered_uid UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Consultants can view profiles of users they invited
CREATE POLICY "Consultants can view invited users profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invites
      WHERE invites.email = profiles.email
      AND invites.created_by = auth.uid()
    )
  );

-- RLS Policies for dashboard_data
CREATE POLICY "Users can view their own dashboard data"
  ON public.dashboard_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard data"
  ON public.dashboard_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard data"
  ON public.dashboard_data FOR UPDATE
  USING (auth.uid() = user_id);

-- Consultants can view dashboard data of users they invited
CREATE POLICY "Consultants can view invited users dashboard data"
  ON public.dashboard_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invites i
      JOIN public.profiles p ON p.email = i.email
      WHERE p.id = dashboard_data.user_id
      AND i.created_by = auth.uid()
    )
  );

-- Consultants can update dashboard data of users they invited
CREATE POLICY "Consultants can update invited users dashboard data"
  ON public.dashboard_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invites i
      JOIN public.profiles p ON p.email = i.email
      WHERE p.id = dashboard_data.user_id
      AND i.created_by = auth.uid()
    )
  );

-- RLS Policies for invites
CREATE POLICY "Consultants can view their own invites"
  ON public.invites FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Consultants can create invites"
  ON public.invites FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Consultants can update their own invites"
  ON public.invites FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Consultants can delete their own invites"
  ON public.invites FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if there's a pending invite for this email
  SELECT * INTO invite_record
  FROM public.invites
  WHERE email = NEW.email AND status = 'pending'
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Create profile with role from invite
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, invite_record.role);
    
    -- Update invite status
    UPDATE public.invites
    SET status = 'registered', registered_uid = NEW.id
    WHERE id = invite_record.id;
  ELSE
    -- Create profile with default role
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'business_owner');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_data_updated_at
  BEFORE UPDATE ON public.dashboard_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();