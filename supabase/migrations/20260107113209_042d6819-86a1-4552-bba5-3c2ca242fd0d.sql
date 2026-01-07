-- Tabela de leads para o funil de vendas
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Dados do Lead
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Status no funil
  status TEXT NOT NULL DEFAULT 'prospeccao'
    CHECK (status IN ('prospeccao', 'abordagem', 'apresentacao', 'followup', 'negociacao', 'fechado_ganho', 'fechado_perdido', 'pos_vendas')),
  
  -- Datas de cada etapa
  prospecting_date TIMESTAMPTZ DEFAULT now(),
  approach_date TIMESTAMPTZ,
  presentation_date TIMESTAMPTZ,
  followup_date TIMESTAMPTZ,
  negotiation_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  post_sale_date TIMESTAMPTZ,
  
  -- Agendamento de contato
  next_contact_date DATE,
  next_contact_notes TEXT,
  
  -- Vendedor responsável
  salesperson_id TEXT,
  salesperson_name TEXT,
  
  -- Valor estimado da oportunidade
  estimated_value NUMERIC(12,2),
  
  -- Origem
  lead_source TEXT,
  
  -- Comentários/Histórico
  comments TEXT,
  
  -- Referência à venda quando convertido
  converted_sale_id UUID REFERENCES public.sales(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_next_contact ON public.leads(next_contact_date);
CREATE INDEX idx_leads_salesperson ON public.leads(salesperson_id);

-- RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users leads"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invites i
      JOIN profiles p ON p.email = i.email
      WHERE p.id = leads.user_id AND i.created_by = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();