import { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  customLogoUrl?: string;
  systemName?: string;
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, customLogoUrl, systemName }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const startThinking = () => setIsThinking(true);
    const stopThinking = () => setIsThinking(false);

    document.addEventListener('nova-start-thinking', startThinking);
    document.addEventListener('nova-stop-thinking', stopThinking);

    return () => {
      document.removeEventListener('nova-start-thinking', startThinking);
      document.removeEventListener('nova-stop-thinking', stopThinking);
    };
  }, []);

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [customLogoUrl]);

  const showCustomLogo = customLogoUrl && !imageError;
  const displayName = systemName || 'Central Inteligente';

  return (
    <div className="flex items-center gap-3 select-none">
      {showCustomLogo ? (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-card
          ${isThinking ? 'shadow-[0_0_20px_hsl(var(--primary)/0.6)] scale-105' : 'shadow-md'} transition-all duration-500
        `}>
          <img 
            src={customLogoUrl} 
            alt="Logo" 
            className="w-full h-full object-contain p-1" 
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl shadow-md border transition-all duration-500
          grid place-items-center bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden
          ${isThinking ? 'shadow-[0_0_25px_hsl(var(--primary)/0.7)] scale-105' : 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]'}
        `}>
          {/* Pulse ring effect */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ${isThinking ? 'animate-ping' : 'animate-pulse'}`} style={{ animationDuration: isThinking ? '1s' : '2s' }} />
          
          {/* Sparkle accent */}
          <Sparkles
            size={10}
            className={`absolute top-1 right-1 text-primary-foreground/60 transition-all duration-500 ${isThinking ? 'opacity-100 animate-pulse' : 'opacity-40'}`}
          />
          
          {/* Main Brain icon */}
          <Brain
            size={26}
            strokeWidth={1.8}
            className={`relative z-10 transition-all duration-500 text-primary-foreground drop-shadow-sm ${isThinking ? 'animate-pulse scale-110' : ''}`}
          />
        </div>
      )}

      {!collapsed && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none whitespace-nowrap tracking-tight bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {displayName}
          </span>
          <span
            className={`text-[7px] font-semibold uppercase tracking-[0.25em] text-center leading-tight transition-all duration-300 block mt-1.5 whitespace-nowrap ${
              isThinking ? 'text-primary animate-pulse' : 'text-muted-foreground/70'
            }`}
          >
            {isThinking ? 'Processando IA...' : 'Mentorship Intelligence'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
