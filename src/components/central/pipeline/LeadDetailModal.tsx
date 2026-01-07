import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lead, LeadStatus, LeadFormData, LEAD_STATUS_CONFIG, ACTIVE_PIPELINE_STAGES } from '@/types/leads';
import { Salesperson } from '@/types';
import { LEAD_SOURCE_OPTIONS } from '@/types/sales';
import { 
  User, Mail, Phone, DollarSign, Calendar, MessageSquare, 
  Trash2, ArrowRight, CheckCircle, XCircle, Clock, History
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeadDetailModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<LeadFormData>) => Promise<any>;
  onDelete: (id: string) => Promise<boolean>;
  onMoveStage: (id: string, newStatus: LeadStatus) => Promise<boolean>;
  team: Salesperson[];
  onConvertToSale?: (lead: Lead) => void;
}

const LeadDetailModal = ({ 
  lead, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  onMoveStage,
  team,
  onConvertToSale
}: LeadDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    client_name: lead.client_name,
    email: lead.email || '',
    phone: lead.phone || '',
    salesperson_id: lead.salesperson_id || '',
    salesperson_name: lead.salesperson_name || '',
    estimated_value: lead.estimated_value || undefined,
    lead_source: lead.lead_source || '',
    next_contact_date: lead.next_contact_date || '',
    next_contact_notes: lead.next_contact_notes || '',
    comments: lead.comments || ''
  });

  const config = LEAD_STATUS_CONFIG[lead.status];
  const currentStageIndex = ACTIVE_PIPELINE_STAGES.indexOf(lead.status as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < ACTIVE_PIPELINE_STAGES.length - 1
    ? ACTIVE_PIPELINE_STAGES[currentStageIndex + 1]
    : null;
  const isActiveStage = ACTIVE_PIPELINE_STAGES.includes(lead.status as any);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(lead.id, formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveNext = async () => {
    if (nextStage) {
      await onMoveStage(lead.id, nextStage);
      onClose();
    }
  };

  const handleWin = async () => {
    // Usa o handler de conversão do PipelineView que abre o modal
    await onMoveStage(lead.id, 'fechado_ganho');
    onClose();
  };

  const handleLose = async () => {
    await onMoveStage(lead.id, 'fechado_perdido');
    onClose();
  };

  const handleDelete = async () => {
    const success = await onDelete(lead.id);
    if (success) {
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const handleSalespersonChange = (salespersonId: string) => {
    const salesperson = team.find(s => s.id === salespersonId);
    setFormData(prev => ({
      ...prev,
      salesperson_id: salespersonId,
      salesperson_name: salesperson?.name || ''
    }));
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                {lead.client_name}
                <Badge className={`${config.bgColor} text-white`}>
                  {config.label}
                </Badge>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Ações Rápidas */}
            {isActiveStage && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground mr-2">Ações:</span>
                {nextStage && (
                  <Button size="sm" variant="outline" onClick={handleMoveNext} className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Mover para {LEAD_STATUS_CONFIG[nextStage].label}
                  </Button>
                )}
                <Button size="sm" variant="default" onClick={handleWin} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  Ganho
                </Button>
                <Button size="sm" variant="destructive" onClick={handleLose} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Perdido
                </Button>
              </div>
            )}

            <Separator />

            {/* Informações do Lead */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{lead.client_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{lead.email || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{lead.phone || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Valor Estimado
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.estimated_value || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        estimated_value: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                    />
                  ) : (
                    <p className="font-medium text-emerald-500">
                      {lead.estimated_value 
                        ? `R$ ${lead.estimated_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : '-'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vendedor Responsável</Label>
                  {isEditing ? (
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
                  ) : (
                    <p className="font-medium">{lead.salesperson_name || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Origem</Label>
                  {isEditing ? (
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
                  ) : (
                    <p className="font-medium">
                      {LEAD_SOURCE_OPTIONS.find(o => o.value === lead.lead_source)?.label || '-'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Próximo Contato
                  </Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.next_contact_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_contact_date: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{formatDate(lead.next_contact_date)}</p>
                  )}
                </div>

                {(isEditing || lead.next_contact_notes) && (
                  <div className="space-y-2">
                    <Label>Objetivo do Contato</Label>
                    {isEditing ? (
                      <Input
                        value={formData.next_contact_notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, next_contact_notes: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">{lead.next_contact_notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comentários */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Comentários
              </Label>
              {isEditing ? (
                <Textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                />
              ) : (
                <p className="text-sm bg-muted/30 p-3 rounded-lg">
                  {lead.comments || 'Sem comentários'}
                </p>
              )}
            </div>

            {/* Histórico de Datas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <History className="h-4 w-4" />
                Histórico do Funil
              </Label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {lead.prospecting_date && (
                  <div className="bg-indigo-500/10 p-2 rounded text-center">
                    <p className="text-indigo-500 font-medium">Prospecção</p>
                    <p className="text-muted-foreground">{formatDate(lead.prospecting_date)}</p>
                  </div>
                )}
                {lead.approach_date && (
                  <div className="bg-violet-500/10 p-2 rounded text-center">
                    <p className="text-violet-500 font-medium">Abordagem</p>
                    <p className="text-muted-foreground">{formatDate(lead.approach_date)}</p>
                  </div>
                )}
                {lead.presentation_date && (
                  <div className="bg-purple-500/10 p-2 rounded text-center">
                    <p className="text-purple-500 font-medium">Apresentação</p>
                    <p className="text-muted-foreground">{formatDate(lead.presentation_date)}</p>
                  </div>
                )}
                {lead.negotiation_date && (
                  <div className="bg-pink-500/10 p-2 rounded text-center">
                    <p className="text-pink-500 font-medium">Negociação</p>
                    <p className="text-muted-foreground">{formatDate(lead.negotiation_date)}</p>
                  </div>
                )}
                {lead.closing_date && (
                  <div className={`${lead.status === 'fechado_ganho' ? 'bg-emerald-500/10' : 'bg-red-500/10'} p-2 rounded text-center`}>
                    <p className={`${lead.status === 'fechado_ganho' ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
                      Fechamento
                    </p>
                    <p className="text-muted-foreground">{formatDate(lead.closing_date)}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Rodapé com ações */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Lead
              </Button>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      Fechar
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Metadados */}
            <div className="text-[10px] text-muted-foreground flex items-center gap-4">
              <span>Criado em: {formatDate(lead.created_at)}</span>
              <span>Atualizado em: {formatDate(lead.updated_at)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead "{lead.client_name}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeadDetailModal;
