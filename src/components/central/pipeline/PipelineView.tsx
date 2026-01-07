import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeads } from '@/hooks/useLeads';
import useSales from '@/hooks/useSales';
import { useAuth } from '@/contexts/AuthContext';
import { Salesperson } from '@/types';
import InfoTooltip from '@/components/central/InfoTooltip';
import SalesFunnelPyramid from './SalesFunnelPyramid';
import PipelineKanban from './PipelineKanban';
import PipelineList from './PipelineList';
import ContactAlerts from './ContactAlerts';
import LeadForm from './LeadForm';
import LeadDetailModal from './LeadDetailModal';
import LeadToSaleModal from './LeadToSaleModal';
import IRISPipelineInsights from './IRISPipelineInsights';
import { Lead, LeadStatus } from '@/types/leads';
import { SaleFormData } from '@/types/sales';
import { toast } from 'sonner';

interface PipelineViewProps {
  team: Salesperson[];
}

const PipelineView = ({ team }: PipelineViewProps) => {
  const { user } = useAuth();
  const {
    leads,
    isLoading,
    leadsByStatus,
    todayContacts,
    overdueContacts,
    funnelMetrics,
    totalPipelineValue,
    totalActiveLeads,
    lostLeadsCount,
    lossRate,
    createLead,
    updateLead,
    moveToStage,
    deleteLead,
    linkToSale
  } = useLeads();

  const { createSale } = useSales(user?.id);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [isConvertingSale, setIsConvertingSale] = useState(false);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handlePyramidClick = (status: string) => {
    setFilterStatus(filterStatus === status ? null : status);
  };

  // Handler para quando lead é movido para "Ganho" - abre modal de conversão
  const handleMoveToStage = useCallback(async (id: string, newStatus: LeadStatus): Promise<boolean> => {
    if (newStatus === 'fechado_ganho') {
      // Encontrar o lead e abrir modal de conversão
      const lead = leads.find(l => l.id === id);
      if (lead) {
        setLeadToConvert(lead);
        return true; // Retorna true mas não move ainda - aguarda conversão
      }
    }
    // Para outros status, move normalmente
    return moveToStage(id, newStatus);
  }, [leads, moveToStage]);

  // Handler para converter lead em venda
  const handleConvertToSale = async (leadId: string, saleData: SaleFormData): Promise<boolean> => {
    setIsConvertingSale(true);
    try {
      // 1. Criar a venda
      const newSale = await createSale({
        ...saleData,
        entry_type: 'individual'
      });

      if (!newSale) {
        toast.error('Erro ao criar venda');
        return false;
      }

      // 2. Vincular o lead à venda e mover para Ganho
      const linked = await linkToSale(leadId, newSale.id);
      
      if (linked) {
        toast.success('🎉 Lead convertido em venda com sucesso!');
        setLeadToConvert(null);
        setSelectedLead(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao converter lead:', error);
      toast.error('Erro ao converter lead em venda');
      return false;
    } finally {
      setIsConvertingSale(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary animate-pulse font-mono tracking-widest">
          Carregando pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Filter className="h-6 w-6 text-blue-500" />
            </div>
            Pipeline de Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e oportunidades de venda
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InfoTooltip 
            text="O Pipeline permite acompanhar leads desde a prospecção até o fechamento. Arraste cards entre colunas para mover leads no funil."
            maxWidth={320}
          />
          <Button onClick={() => setShowLeadForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* IRIS Insights Proativos */}
      <IRISPipelineInsights 
        leads={leads}
        onLeadClick={handleLeadClick}
      />

      {/* Alertas de Contato */}
      <ContactAlerts 
        todayContacts={todayContacts}
        overdueContacts={overdueContacts}
        onLeadClick={handleLeadClick}
      />

      {/* Pirâmide do Funil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SalesFunnelPyramid 
          metrics={funnelMetrics}
          totalValue={totalPipelineValue}
          totalLeads={totalActiveLeads}
          onStageClick={handlePyramidClick}
          activeStage={filterStatus}
          lostLeadsCount={lostLeadsCount}
          lossRate={lossRate}
        />
      </motion.div>

      {/* Kanban / Lista */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <PipelineKanban 
            leadsByStatus={leadsByStatus}
            onLeadClick={handleLeadClick}
            onMoveStage={handleMoveToStage}
            filterStatus={filterStatus}
          />
        </TabsContent>

        <TabsContent value="list">
          <PipelineList 
            leads={leads}
            onLeadClick={handleLeadClick}
            onMoveStage={handleMoveToStage}
            onDelete={deleteLead}
            team={team}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Lead */}
      <LeadForm 
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={createLead}
        team={team}
      />

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
          onMoveStage={handleMoveToStage}
          team={team}
        />
      )}

      {/* Modal de Conversão Lead → Venda */}
      {leadToConvert && (
        <LeadToSaleModal
          lead={leadToConvert}
          isOpen={!!leadToConvert}
          onClose={() => setLeadToConvert(null)}
          onSubmit={handleConvertToSale}
          team={team}
          isSubmitting={isConvertingSale}
        />
      )}
    </div>
  );
};

export default PipelineView;
