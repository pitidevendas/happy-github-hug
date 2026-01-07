import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, DollarSign, User, MapPin, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/leads';
import { SaleFormData, CHANNEL_OPTIONS, LEAD_SOURCE_OPTIONS, LeadSource } from '@/types/sales';
import { Salesperson } from '@/types';

const saleSchema = z.object({
  sale_date: z.string().min(1, 'Data é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  salesperson_id: z.string().min(1, 'Vendedor é obrigatório'),
  salesperson_name: z.string().min(1, 'Vendedor é obrigatório'),
  channel: z.enum(['online', 'presencial']),
  client_name: z.string().optional(),
  is_new_client: z.boolean(),
  acquisition_cost: z.number().min(0),
  lead_source: z.enum(['indicacao', 'redes_sociais', 'google', 'evento', 'cold_call', 'parceiro', 'outro']).optional(),
  product_service: z.string().optional(),
  notes: z.string().optional(),
});

interface LeadToSaleModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadId: string, saleData: SaleFormData) => Promise<boolean>;
  team: Salesperson[];
  isSubmitting?: boolean;
}

const LeadToSaleModal: React.FC<LeadToSaleModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSubmit,
  team,
  isSubmitting = false,
}) => {
  const [date, setDate] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      amount: lead.estimated_value || 0,
      salesperson_id: lead.salesperson_id || '',
      salesperson_name: lead.salesperson_name || '',
      channel: 'presencial',
      client_name: lead.client_name,
      is_new_client: true,
      acquisition_cost: 0,
      lead_source: (lead.lead_source as LeadSource) || undefined,
    },
  });

  const watchIsNewClient = watch('is_new_client');

  // Pre-fill when lead changes
  useEffect(() => {
    if (lead) {
      setValue('amount', lead.estimated_value || 0);
      setValue('salesperson_id', lead.salesperson_id || '');
      setValue('salesperson_name', lead.salesperson_name || '');
      setValue('client_name', lead.client_name);
      setValue('lead_source', (lead.lead_source as LeadSource) || undefined);
      setValue('notes', lead.comments || '');
    }
  }, [lead, setValue]);

  useEffect(() => {
    setValue('sale_date', format(date, 'yyyy-MM-dd'));
  }, [date, setValue]);

  const handleSalespersonChange = (salespersonId: string) => {
    const salesperson = team.find(s => s.id === salespersonId);
    if (salesperson) {
      setValue('salesperson_id', salesperson.id);
      setValue('salesperson_name', salesperson.name);
    }
  };

  const onFormSubmit = async (data: SaleFormData) => {
    const success = await onSubmit(lead.id, data);
    if (success) {
      reset();
      setDate(new Date());
      onClose();
    }
  };

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Trophy className="h-6 w-6 text-emerald-500" />
            </div>
            Converter Lead em Venda
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Parabéns! Registre a venda do lead "{lead.client_name}"
          </DialogDescription>
        </DialogHeader>

        {/* Lead Info Summary */}
        <div className="bg-muted/50 rounded-xl p-4 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lead</p>
              <p className="font-semibold text-foreground">{lead.client_name}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Valor Estimado</p>
              <p className="font-semibold text-emerald-500">
                {lead.estimated_value ? formatCurrency(lead.estimated_value) : 'Não informado'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Vendedor</p>
              <p className="font-semibold text-foreground">{lead.salesperson_name || 'Não atribuído'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data da Venda */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary" />
                Data da Venda *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {errors.sale_date && (
                <p className="text-xs text-destructive">{errors.sale_date.message}</p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                Valor Final da Venda *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  className="pl-10"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Vendedor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                Vendedor *
              </Label>
              <Select 
                value={watch('salesperson_id')} 
                onValueChange={handleSalespersonChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeam.length > 0 ? (
                    activeTeam.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled>
                      Nenhum vendedor cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.salesperson_id && (
                <p className="text-xs text-destructive">{errors.salesperson_id.message}</p>
              )}
            </div>

            {/* Canal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin size={16} className="text-violet-500" />
                Canal *
              </Label>
              <Select 
                defaultValue="presencial" 
                onValueChange={(v) => setValue('channel', v as 'online' | 'presencial')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* É Cliente Novo? */}
            <div className="space-y-2">
              <Label>É cliente novo?</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={watchIsNewClient}
                  onCheckedChange={(checked) => setValue('is_new_client', checked)}
                />
                <span className={cn(
                  "text-sm",
                  watchIsNewClient ? "text-emerald-500 font-medium" : "text-muted-foreground"
                )}>
                  {watchIsNewClient ? 'Sim, primeira compra!' : 'Não, cliente recorrente'}
                </span>
              </div>
            </div>

            {/* Custo de Aquisição */}
            {watchIsNewClient && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign size={16} className="text-orange-500" />
                  Custo de Aquisição (CAC)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="pl-10"
                    {...register('acquisition_cost', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            {/* Origem (já pré-preenchido do lead) */}
            <div className="space-y-2">
              <Label>Origem do Lead</Label>
              <Select 
                value={watch('lead_source')} 
                onValueChange={(v) => setValue('lead_source', v as LeadSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como o cliente chegou?" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Produto/Serviço */}
            <div className="space-y-2">
              <Label>Produto/Serviço</Label>
              <Input
                placeholder="Ex: Consultoria, Produto X..."
                {...register('product_service')}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Anotações adicionais sobre a venda..."
              className="resize-none"
              rows={2}
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 gap-2"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Registrando...</span>
              ) : (
                <>
                  <Trophy size={18} />
                  Registrar Venda
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadToSaleModal;
