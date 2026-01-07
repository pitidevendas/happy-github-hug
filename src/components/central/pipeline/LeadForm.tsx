import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadFormData } from '@/types/leads';
import { Salesperson } from '@/types';
import { LEAD_SOURCE_OPTIONS } from '@/types/sales';
import { User, Mail, Phone, DollarSign, Calendar, MessageSquare } from 'lucide-react';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<any>;
  team: Salesperson[];
}

const LeadForm = ({ isOpen, onClose, onSubmit, team }: LeadFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    client_name: '',
    email: '',
    phone: '',
    salesperson_id: '',
    salesperson_name: '',
    estimated_value: undefined,
    lead_source: '',
    next_contact_date: '',
    next_contact_notes: '',
    comments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        client_name: '',
        email: '',
        phone: '',
        salesperson_id: '',
        salesperson_name: '',
        estimated_value: undefined,
        lead_source: '',
        next_contact_date: '',
        next_contact_notes: '',
        comments: ''
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalespersonChange = (salespersonId: string) => {
    const salesperson = team.find(s => s.id === salespersonId);
    setFormData(prev => ({
      ...prev,
      salesperson_id: salespersonId,
      salesperson_name: salesperson?.name || ''
    }));
  };

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome do Cliente *
            </Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
              placeholder="Nome do lead/cliente"
              required
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Vendedor e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendedor Responsável</Label>
              <Select value={formData.salesperson_id} onValueChange={handleSalespersonChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTeam.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_value" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Estimado
              </Label>
              <Input
                id="estimated_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_value || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_value: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Origem e Próximo Contato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem do Lead</Label>
              <Select value={formData.lead_source} onValueChange={(v) => setFormData(prev => ({ ...prev, lead_source: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_contact_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximo Contato
              </Label>
              <Input
                id="next_contact_date"
                type="date"
                value={formData.next_contact_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_contact_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Notas do Próximo Contato */}
          {formData.next_contact_date && (
            <div className="space-y-2">
              <Label htmlFor="next_contact_notes">Objetivo do Contato</Label>
              <Input
                id="next_contact_notes"
                value={formData.next_contact_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, next_contact_notes: e.target.value }))}
                placeholder="Ex: Apresentar proposta comercial"
              />
            </div>
          )}

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Informações adicionais sobre o lead..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.client_name.trim()}>
              {isSubmitting ? 'Salvando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadForm;
