import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardData } from '@/types';
import { useLeads } from './useLeads';

export interface ExecutiveSummaryMetrics {
  companyName: string;
  businessSegment: string;
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  currentMonthRevenue: number;
  currentMonthGoal: number;
  currentMonthName: string;
  averageTicket: number;
  conversionRate: number;
  totalSalesCount: number;
  totalAttendances: number;
  activeCustomers: number;
  cac: number;
  ltv: number;
  selectedYear: number;
  teamPerformance: {
    name: string;
    revenue: number;
    goal: number;
    percentAchieved: number;
  }[];
  topPerformer?: { name: string; revenue: number };
  bottomPerformer?: { name: string; revenue: number };
  pipelineStats?: {
    totalLeads: number;
    hotLeads: number;
    averageValue: number;
    stalledCount: number;
  };
}

export interface ExecutiveSummaryResult {
  summary: string;
  generatedAt: string;
  metrics: {
    annualProgress: number;
    monthProgress: number;
  };
}

export interface UseExecutiveSummaryReturn {
  summaryData: ExecutiveSummaryResult | null;
  isLoading: boolean;
  error: string | null;
  generateSummary: (data: DashboardData) => Promise<void>;
}

export function useExecutiveSummary(): UseExecutiveSummaryReturn {
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { leads } = useLeads();

  const generateSummary = useCallback(async (data: DashboardData) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                         "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

      // Calculate team performance
      const activeTeam = data.team.filter(m => m.active && !m.isPlaceholder);
      const teamPerformance = activeTeam.map(member => ({
        name: member.name,
        revenue: member.totalRevenue,
        goal: member.monthlyGoal,
        percentAchieved: member.monthlyGoal > 0 ? (member.totalRevenue / member.monthlyGoal) * 100 : 0,
      }));

      const sortedByRevenue = [...teamPerformance].sort((a, b) => b.revenue - a.revenue);
      const topPerformer = sortedByRevenue[0];
      const bottomPerformer = sortedByRevenue[sortedByRevenue.length - 1];

      // Calculate pipeline stats
      const totalLeads = leads.length;
      const hotLeads = leads.filter(l => l.status === 'negociacao').length;
      const leadsWithValue = leads.filter(l => l.estimated_value && l.estimated_value > 0);
      const averageValue = leadsWithValue.length > 0 
        ? leadsWithValue.reduce((sum, l) => sum + (l.estimated_value || 0), 0) / leadsWithValue.length 
        : 0;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const stalledCount = leads.filter(l => {
        const lastUpdate = new Date(l.updated_at || l.created_at || new Date());
        return lastUpdate < sevenDaysAgo && !['fechado_ganho', 'fechado_perdido'].includes(l.status);
      }).length;

      // Get current month data
      const shortMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentMonthData = data.currentYearData.find(
        d => d.month === shortMonthNames[currentMonthIndex]
      );

      const metrics: ExecutiveSummaryMetrics = {
        companyName: data.companyName || 'Empresa',
        businessSegment: data.businessSegment || 'Não especificado',
        annualGoal: data.kpis.annualGoal,
        annualRealized: data.kpis.annualRealized,
        lastYearGrowth: data.kpis.lastYearGrowth,
        currentMonthRevenue: currentMonthData?.revenue || 0,
        currentMonthGoal: currentMonthData?.goal || 0,
        currentMonthName: monthNames[currentMonthIndex],
        averageTicket: data.kpis.averageTicket,
        conversionRate: data.kpis.conversionRate,
        totalSalesCount: data.kpis.totalSalesCount,
        totalAttendances: data.kpis.totalAttendances || 0,
        activeCustomers: data.kpis.activeCustomers,
        cac: data.kpis.cac,
        ltv: data.kpis.ltv,
        selectedYear: currentYear,
        teamPerformance,
        topPerformer: topPerformer ? { name: topPerformer.name, revenue: topPerformer.revenue } : undefined,
        bottomPerformer: bottomPerformer && sortedByRevenue.length > 1 
          ? { name: bottomPerformer.name, revenue: bottomPerformer.revenue } 
          : undefined,
        pipelineStats: totalLeads > 0 ? {
          totalLeads,
          hotLeads,
          averageValue,
          stalledCount,
        } : undefined,
      };

      const { data: responseData, error: fnError } = await supabase.functions.invoke('executive-summary', {
        body: { metrics }
      });

      if (fnError) throw new Error(fnError.message);

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      setSummaryData(responseData as ExecutiveSummaryResult);
    } catch (err) {
      console.error('[useExecutiveSummary] Error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar sumário');
    } finally {
      setIsLoading(false);
    }
  }, [leads]);

  return {
    summaryData,
    isLoading,
    error,
    generateSummary,
  };
}
