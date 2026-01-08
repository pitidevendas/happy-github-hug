-- Tabela para configurações de white-label por consultor/usuário
CREATE TABLE public.whitelabel_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_name TEXT DEFAULT 'Central Inteligente',
  primary_color TEXT DEFAULT '221 83% 53%', -- HSL format
  accent_color TEXT DEFAULT '186 94% 50%',
  sidebar_color TEXT DEFAULT '222 47% 6%',
  favicon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whitelabel_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários podem ler/editar suas próprias configurações
CREATE POLICY "Users can view their own whitelabel settings" 
ON public.whitelabel_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own whitelabel settings" 
ON public.whitelabel_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whitelabel settings" 
ON public.whitelabel_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whitelabel settings" 
ON public.whitelabel_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_whitelabel_settings_updated_at
BEFORE UPDATE ON public.whitelabel_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();