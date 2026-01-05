-- ============================================
-- FASE 2: Tabelas para RMR, PGV e FIVI
-- ============================================

-- Tabela para reuniões RMR
CREATE TABLE public.rmr_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'pending')),
  monthly_goal NUMERIC NOT NULL DEFAULT 0,
  previous_month_revenue NUMERIC NOT NULL DEFAULT 0,
  motivational_theme TEXT,
  strategies JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  highlighted_employee_id TEXT,
  highlighted_employee_name TEXT,
  highlight_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para semanas do PGV
CREATE TABLE public.pgv_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 6),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 5,
  monthly_goal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month, week_number)
);

-- Tabela para lançamentos do PGV por vendedor
CREATE TABLE public.pgv_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pgv_week_id UUID NOT NULL REFERENCES public.pgv_weeks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  salesperson_id TEXT NOT NULL,
  salesperson_name TEXT NOT NULL,
  daily_goal NUMERIC NOT NULL DEFAULT 0,
  weekly_goal NUMERIC NOT NULL DEFAULT 0,
  weekly_realized NUMERIC NOT NULL DEFAULT 0,
  monthly_accumulated NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pgv_week_id, salesperson_id)
);

-- Tabela para sessões FIVI
CREATE TABLE public.fivi_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  salesperson_id TEXT NOT NULL,
  salesperson_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number INTEGER NOT NULL,
  -- As 5 perguntas estratégicas
  actions_executed TEXT,
  improvement_ideas TEXT,
  failed_actions TEXT,
  support_needed TEXT,
  weekly_commitment NUMERIC NOT NULL DEFAULT 0,
  -- Dados do PGV vinculados
  weekly_goal NUMERIC NOT NULL DEFAULT 0,
  weekly_realized NUMERIC NOT NULL DEFAULT 0,
  previous_commitment NUMERIC,
  previous_realized NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rmr_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgv_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgv_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fivi_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rmr_meetings
CREATE POLICY "Users can view their own RMR meetings"
  ON public.rmr_meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RMR meetings"
  ON public.rmr_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RMR meetings"
  ON public.rmr_meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RMR meetings"
  ON public.rmr_meetings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users RMR meetings"
  ON public.rmr_meetings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = rmr_meetings.user_id AND i.created_by = auth.uid()
  ));

-- RLS Policies for pgv_weeks
CREATE POLICY "Users can view their own PGV weeks"
  ON public.pgv_weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PGV weeks"
  ON public.pgv_weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PGV weeks"
  ON public.pgv_weeks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PGV weeks"
  ON public.pgv_weeks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users PGV weeks"
  ON public.pgv_weeks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = pgv_weeks.user_id AND i.created_by = auth.uid()
  ));

-- RLS Policies for pgv_entries
CREATE POLICY "Users can view their own PGV entries"
  ON public.pgv_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PGV entries"
  ON public.pgv_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PGV entries"
  ON public.pgv_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PGV entries"
  ON public.pgv_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users PGV entries"
  ON public.pgv_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = pgv_entries.user_id AND i.created_by = auth.uid()
  ));

-- RLS Policies for fivi_sessions
CREATE POLICY "Users can view their own FIVI sessions"
  ON public.fivi_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FIVI sessions"
  ON public.fivi_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FIVI sessions"
  ON public.fivi_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FIVI sessions"
  ON public.fivi_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users FIVI sessions"
  ON public.fivi_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = fivi_sessions.user_id AND i.created_by = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_rmr_meetings_updated_at
  BEFORE UPDATE ON public.rmr_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgv_weeks_updated_at
  BEFORE UPDATE ON public.pgv_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgv_entries_updated_at
  BEFORE UPDATE ON public.pgv_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fivi_sessions_updated_at
  BEFORE UPDATE ON public.fivi_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();