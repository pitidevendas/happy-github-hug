import { motion } from 'framer-motion';
import { User, DollarSign, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Lead } from '@/types/leads';
import { Badge } from '@/components/ui/badge';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  index: number;
}

const LeadCard = ({ lead, onClick, index }: LeadCardProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isToday = lead.next_contact_date === today;
  const isOverdue = lead.next_contact_date && lead.next_contact_date < today;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`
        bg-card rounded-lg p-3 border cursor-pointer transition-all
        hover:shadow-md hover:border-primary/30
        ${isOverdue ? 'border-red-500/50 bg-red-500/5' : 
          isToday ? 'border-amber-500/50 bg-amber-500/5' : 
          'border-border'}
      `}
    >
      {/* Badges de urgência */}
      {(isToday || isOverdue) && (
        <div className="mb-2">
          {isOverdue ? (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="h-3 w-3" />
              ATRASADO
            </Badge>
          ) : (
            <Badge className="bg-amber-500 text-[10px] gap-1">
              <Clock className="h-3 w-3" />
              HOJE
            </Badge>
          )}
        </div>
      )}

      {/* Nome do Cliente */}
      <h4 className="font-medium text-sm text-foreground truncate mb-2">
        {lead.client_name}
      </h4>

      {/* Valor Estimado */}
      {lead.estimated_value && lead.estimated_value > 0 && (
        <div className="flex items-center gap-1.5 text-emerald-500 mb-2">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="text-sm font-semibold">
            {formatCurrency(lead.estimated_value)}
          </span>
        </div>
      )}

      {/* Vendedor */}
      {lead.salesperson_name && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
          <User className="h-3 w-3" />
          <span className="text-xs truncate">{lead.salesperson_name}</span>
        </div>
      )}

      {/* Próximo Contato */}
      {lead.next_contact_date && !isToday && !isOverdue && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formatDate(lead.next_contact_date)}</span>
        </div>
      )}

      {/* Origem */}
      {lead.lead_source && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase">
            {lead.lead_source.replace('_', ' ')}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default LeadCard;
