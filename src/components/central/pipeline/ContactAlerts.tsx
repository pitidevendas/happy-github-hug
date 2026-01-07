import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Phone } from 'lucide-react';
import { Lead } from '@/types/leads';

interface ContactAlertsProps {
  todayContacts: Lead[];
  overdueContacts: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const ContactAlerts = ({ todayContacts, overdueContacts, onLeadClick }: ContactAlertsProps) => {
  if (todayContacts.length === 0 && overdueContacts.length === 0) {
    return null;
  }

  const getDaysOverdue = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Contatos para Hoje */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`rounded-xl p-4 border ${
          todayContacts.length > 0 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-muted/30 border-border'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${todayContacts.length > 0 ? 'bg-amber-500/20' : 'bg-muted'}`}>
            <Clock className={`h-5 w-5 ${todayContacts.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${todayContacts.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              Contatos para HOJE
            </h3>
            <p className="text-xs text-muted-foreground">
              {todayContacts.length} {todayContacts.length === 1 ? 'lead' : 'leads'}
            </p>
          </div>
        </div>

        {todayContacts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {todayContacts.slice(0, 5).map(lead => (
              <button
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-amber-500/30 text-sm hover:bg-amber-500/10 transition-colors"
              >
                <Phone className="h-3 w-3 text-amber-500" />
                <span className="truncate max-w-[100px]">{lead.client_name}</span>
                {lead.salesperson_name && (
                  <span className="text-xs text-muted-foreground">→ {lead.salesperson_name.split(' ')[0]}</span>
                )}
              </button>
            ))}
            {todayContacts.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">
                +{todayContacts.length - 5} mais
              </span>
            )}
          </div>
        )}

        {todayContacts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum contato agendado para hoje</p>
        )}
      </motion.div>

      {/* Contatos Atrasados */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`rounded-xl p-4 border ${
          overdueContacts.length > 0 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-muted/30 border-border'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${overdueContacts.length > 0 ? 'bg-red-500/20' : 'bg-muted'}`}>
            <AlertTriangle className={`h-5 w-5 ${overdueContacts.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${overdueContacts.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              ATRASADOS
            </h3>
            <p className="text-xs text-muted-foreground">
              {overdueContacts.length} {overdueContacts.length === 1 ? 'lead' : 'leads'}
            </p>
          </div>
        </div>

        {overdueContacts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {overdueContacts.slice(0, 5).map(lead => (
              <button
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-red-500/30 text-sm hover:bg-red-500/10 transition-colors"
              >
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="truncate max-w-[100px]">{lead.client_name}</span>
                <span className="text-xs text-red-400">
                  há {getDaysOverdue(lead.next_contact_date!)}d
                </span>
              </button>
            ))}
            {overdueContacts.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">
                +{overdueContacts.length - 5} mais
              </span>
            )}
          </div>
        )}

        {overdueContacts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum contato atrasado</p>
        )}
      </motion.div>
    </div>
  );
};

export default ContactAlerts;
