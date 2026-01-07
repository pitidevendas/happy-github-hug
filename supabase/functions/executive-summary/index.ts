import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardMetrics {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json() as { metrics: DashboardMetrics };
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[executive-summary] Generating summary for:", metrics.companyName);

    const annualProgress = ((metrics.annualRealized / metrics.annualGoal) * 100).toFixed(1);
    const monthProgress = ((metrics.currentMonthRevenue / metrics.currentMonthGoal) * 100).toFixed(1);

    const systemPrompt = `Você é um consultor de gestão empresarial experiente, especializado em análise de performance comercial. Gere um sumário executivo profissional e estratégico em português brasileiro.

REGRAS DE FORMATAÇÃO:
- Use Markdown para estruturar o documento
- Inclua seções claras com headers (##)
- Use bullet points para listas
- Destaque números importantes em negrito
- Mantenha tom profissional e analítico
- O documento deve ser adequado para apresentação a diretoria/stakeholders
- Máximo de 600 palavras`;

    const userPrompt = `Gere um Sumário Executivo para a empresa ${metrics.companyName} (segmento: ${metrics.businessSegment}) baseado nos seguintes dados de ${metrics.currentMonthName}/${metrics.selectedYear}:

## DADOS DE PERFORMANCE

### Resultados Anuais (${metrics.selectedYear})
- Meta Anual: R$ ${metrics.annualGoal.toLocaleString('pt-BR')}
- Realizado: R$ ${metrics.annualRealized.toLocaleString('pt-BR')} (${annualProgress}%)
- Crescimento vs ${metrics.selectedYear - 1}: ${metrics.lastYearGrowth > 0 ? '+' : ''}${metrics.lastYearGrowth.toFixed(1)}%

### Resultados do Mês (${metrics.currentMonthName})
- Meta: R$ ${metrics.currentMonthGoal.toLocaleString('pt-BR')}
- Realizado: R$ ${metrics.currentMonthRevenue.toLocaleString('pt-BR')} (${monthProgress}%)
- Total de Vendas: ${metrics.totalSalesCount}
- Atendimentos: ${metrics.totalAttendances || 'N/D'}

### Indicadores Operacionais
- Ticket Médio: R$ ${metrics.averageTicket.toLocaleString('pt-BR')}
- Taxa de Conversão: ${metrics.conversionRate.toFixed(1)}%
- CAC: R$ ${metrics.cac.toLocaleString('pt-BR')}
- LTV: R$ ${metrics.ltv.toLocaleString('pt-BR')}
- Clientes Ativos: ${metrics.activeCustomers}

### Performance da Equipe
${metrics.teamPerformance.map(m => `- ${m.name}: R$ ${m.revenue.toLocaleString('pt-BR')} (${m.percentAchieved.toFixed(0)}% da meta)`).join('\n')}
${metrics.topPerformer ? `\n**Destaque Positivo**: ${metrics.topPerformer.name} com R$ ${metrics.topPerformer.revenue.toLocaleString('pt-BR')}` : ''}
${metrics.bottomPerformer ? `\n**Atenção**: ${metrics.bottomPerformer.name} com R$ ${metrics.bottomPerformer.revenue.toLocaleString('pt-BR')}` : ''}

${metrics.pipelineStats ? `### Pipeline de Vendas
- Total de Leads: ${metrics.pipelineStats.totalLeads}
- Leads Quentes: ${metrics.pipelineStats.hotLeads}
- Valor Médio: R$ ${metrics.pipelineStats.averageValue.toLocaleString('pt-BR')}
- Leads Parados: ${metrics.pipelineStats.stalledCount}` : ''}

## INSTRUÇÕES

Gere um Sumário Executivo profissional com as seguintes seções:

1. **Resumo da Situação** - Visão geral da performance atual
2. **Pontos Fortes** - Destaques positivos identificados
3. **Pontos de Atenção** - Áreas que precisam de foco
4. **Análise de Tendências** - Projeções baseadas nos dados
5. **Recomendações Estratégicas** - 3-5 ações prioritárias sugeridas
6. **Conclusão** - Síntese executiva em 2-3 frases

O tom deve ser profissional, direto e orientado a ação. Baseie-se exclusivamente nos dados fornecidos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[executive-summary] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Tente novamente em alguns instantes.",
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos de IA esgotados. Entre em contato com o suporte.",
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("[executive-summary] Generated summary length:", content?.length);

    return new Response(JSON.stringify({ 
      summary: content,
      generatedAt: new Date().toISOString(),
      metrics: {
        annualProgress: parseFloat(annualProgress),
        monthProgress: parseFloat(monthProgress),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[executive-summary] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
