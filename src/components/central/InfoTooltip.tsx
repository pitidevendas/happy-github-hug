import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  return (
    <div className="group relative inline-block ml-1 align-middle">
      <Info size={14} className="text-muted-foreground cursor-help hover:text-primary transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center shadow-lg pointer-events-none border border-border after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-popover">
        {text}
      </div>
    </div>
  );
};

export default InfoTooltip;
