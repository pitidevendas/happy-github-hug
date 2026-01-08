import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useWhitelabel, { COLOR_PRESETS } from '@/hooks/useWhitelabel';

interface WhitelabelSettingsProps {
  onSave?: () => void;
}

export default function WhitelabelSettings({ onSave }: WhitelabelSettingsProps) {
  const { toast } = useToast();
  const { settings, isLoading, saveSettings, resetToDefaults } = useWhitelabel();
  
  const [systemName, setSystemName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customPrimary, setCustomPrimary] = useState('');
  const [customAccent, setCustomAccent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSystemName(settings.systemName);
      setCustomPrimary(settings.primaryColor);
      setCustomAccent(settings.accentColor);
      
      // Find matching preset
      const presetIndex = COLOR_PRESETS.findIndex(
        p => p.primary === settings.primaryColor && p.accent === settings.accentColor
      );
      setSelectedPreset(presetIndex >= 0 ? presetIndex : null);
    }
  }, [settings]);

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    const preset = COLOR_PRESETS[index];
    setCustomPrimary(preset.primary);
    setCustomAccent(preset.accent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preset = selectedPreset !== null ? COLOR_PRESETS[selectedPreset] : null;
      
      const success = await saveSettings({
        systemName,
        primaryColor: customPrimary,
        accentColor: customAccent,
        sidebarColor: preset?.sidebar || settings?.sidebarColor,
      });

      if (success) {
        toast({
          title: 'Personalização salva!',
          description: 'As cores e nome do sistema foram atualizados.',
        });
        onSave?.();
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const success = await resetToDefaults();
      if (success) {
        setSelectedPreset(0);
        setSystemName('Central Inteligente');
        setCustomPrimary(COLOR_PRESETS[0].primary);
        setCustomAccent(COLOR_PRESETS[0].accent);
        toast({
          title: 'Configurações restauradas',
          description: 'As cores padrão foram aplicadas.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Preview color conversion (HSL to hex for display)
  const hslToPreviewStyle = (hsl: string) => {
    return { backgroundColor: `hsl(${hsl})` };
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">White-label</CardTitle>
          </div>
          <CardDescription>
            Personalize o nome e as cores do sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* System Name */}
          <div className="space-y-2">
            <Label htmlFor="systemName">Nome do Sistema</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Central Inteligente"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá no título da página e no logo
            </p>
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label>Tema de Cores</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(index)}
                  className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPreset === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={hslToPreviewStyle(preset.primary)}
                    />
                    <div
                      className="w-5 h-5 rounded-full"
                      style={hslToPreviewStyle(preset.accent)}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                  
                  {selectedPreset === index && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={hslToPreviewStyle(customPrimary)}
                >
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: `hsl(${customPrimary})` }}>
                    {systemName || 'Central Inteligente'}
                  </p>
                  <p className="text-xs text-muted-foreground">Mentorship Intelligence</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
                  style={hslToPreviewStyle(customPrimary)}
                >
                  Botão Primário
                </div>
                <div
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(${customAccent} / 0.2)`,
                    color: `hsl(${customAccent})`,
                  }}
                >
                  Botão Secundário
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Salvando...' : 'Salvar Personalização'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
