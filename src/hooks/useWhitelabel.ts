import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WhitelabelSettings {
  id?: string;
  userId: string;
  systemName: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  faviconUrl?: string;
}

interface UseWhitelabelReturn {
  settings: WhitelabelSettings | null;
  isLoading: boolean;
  saveSettings: (newSettings: Partial<WhitelabelSettings>) => Promise<boolean>;
  applyTheme: () => void;
  resetToDefaults: () => Promise<boolean>;
}

const DEFAULT_SETTINGS: Omit<WhitelabelSettings, 'userId'> = {
  systemName: 'Central Inteligente',
  primaryColor: '221 83% 53%',
  accentColor: '186 94% 50%',
  sidebarColor: '222 47% 6%',
};

// Preset color themes
export const COLOR_PRESETS = [
  { 
    name: 'Padrão (Azul)', 
    primary: '221 83% 53%', 
    accent: '186 94% 50%',
    sidebar: '222 47% 6%'
  },
  { 
    name: 'Roxo Royal', 
    primary: '262 83% 58%', 
    accent: '280 65% 60%',
    sidebar: '260 40% 8%'
  },
  { 
    name: 'Esmeralda', 
    primary: '160 84% 39%', 
    accent: '142 76% 36%',
    sidebar: '160 40% 6%'
  },
  { 
    name: 'Laranja Vibrante', 
    primary: '24 95% 53%', 
    accent: '38 92% 50%',
    sidebar: '24 40% 6%'
  },
  { 
    name: 'Rosa Moderno', 
    primary: '330 81% 60%', 
    accent: '350 89% 60%',
    sidebar: '330 40% 6%'
  },
  { 
    name: 'Azul Marinho', 
    primary: '215 85% 45%', 
    accent: '200 80% 50%',
    sidebar: '215 50% 5%'
  },
];

export default function useWhitelabel(): UseWhitelabelReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WhitelabelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whitelabel_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          systemName: data.system_name || DEFAULT_SETTINGS.systemName,
          primaryColor: data.primary_color || DEFAULT_SETTINGS.primaryColor,
          accentColor: data.accent_color || DEFAULT_SETTINGS.accentColor,
          sidebarColor: data.sidebar_color || DEFAULT_SETTINGS.sidebarColor,
          faviconUrl: data.favicon_url || undefined,
        });
      } else {
        // No settings yet, use defaults
        setSettings({
          userId: user.id,
          ...DEFAULT_SETTINGS,
        });
      }
    } catch (error) {
      console.error('Error fetching whitelabel settings:', error);
      // Use defaults on error
      if (user?.id) {
        setSettings({
          userId: user.id,
          ...DEFAULT_SETTINGS,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply theme to CSS variables
  const applyTheme = useCallback(() => {
    if (!settings) return;

    const root = document.documentElement;
    
    // Apply to both root and dark class
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--ring', settings.primaryColor);
    
    // Update sidebar in dark mode
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.style.setProperty('--sidebar-background', settings.sidebarColor);
    }

    // Update system name in title
    document.title = settings.systemName;

    // Update favicon if provided
    if (settings.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = settings.faviconUrl;
      }
    }
  }, [settings]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const saveSettings = async (newSettings: Partial<WhitelabelSettings>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const updatedSettings = {
        user_id: user.id,
        system_name: newSettings.systemName ?? settings?.systemName ?? DEFAULT_SETTINGS.systemName,
        primary_color: newSettings.primaryColor ?? settings?.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
        accent_color: newSettings.accentColor ?? settings?.accentColor ?? DEFAULT_SETTINGS.accentColor,
        sidebar_color: newSettings.sidebarColor ?? settings?.sidebarColor ?? DEFAULT_SETTINGS.sidebarColor,
        favicon_url: newSettings.faviconUrl ?? settings?.faviconUrl ?? null,
      };

      const { error } = await supabase
        .from('whitelabel_settings')
        .upsert(updatedSettings, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(prev => ({
        ...prev!,
        ...newSettings,
      }));

      return true;
    } catch (error) {
      console.error('Error saving whitelabel settings:', error);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    return saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    isLoading,
    saveSettings,
    applyTheme,
    resetToDefaults,
  };
}
