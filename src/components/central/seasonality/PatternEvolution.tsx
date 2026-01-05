import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { MonthlyData } from "@/types";
import InfoTooltip from "../InfoTooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PatternEvolutionProps {
  historicalData: MonthlyData[];
  monthOrder: string[];
}

const PatternEvolution = ({ historicalData, monthOrder }: PatternEvolutionProps) => {
  const allYears = [...new Set(historicalData.map(d => d.year))].sort();

  // Calculate pattern for first half and second half of available years
  const halfIdx = Math.floor(allYears.length / 2);
  const earlyYears = allYears.slice(0, halfIdx || 1);
  const recentYears = allYears.slice(halfIdx || allYears.length - 1);

  const calculatePattern = (years: number[]) => {
    return monthOrder.map(month => {
      const monthData = historicalData.filter(d => d.month === month && years.includes(d.year));
      const avgRevenue = monthData.length > 0
        ? monthData.reduce((sum, d) => sum + d.revenue, 0) / monthData.length
        : 0;
      return { month, avgRevenue };
    });
  };

  const earlyPattern = calculatePattern(earlyYears);
  const recentPattern = calculatePattern(recentYears);

  // Calculate global averages for normalization
  const earlyAvg = earlyPattern.reduce((sum, m) => sum + m.avgRevenue, 0) / earlyPattern.filter(m => m.avgRevenue > 0).length || 1;
  const recentAvg = recentPattern.reduce((sum, m) => sum + m.avgRevenue, 0) / recentPattern.filter(m => m.avgRevenue > 0).length || 1;

  // Create normalized comparison data
  const comparisonData = monthOrder.map((month, idx) => ({
    month,
    earlyIndex: earlyPattern[idx].avgRevenue > 0 ? earlyPattern[idx].avgRevenue / earlyAvg : 0,
    recentIndex: recentPattern[idx].avgRevenue > 0 ? recentPattern[idx].avgRevenue / recentAvg : 0,
  }));

  // Find months with biggest changes
  const monthChanges = comparisonData
    .map(m => ({
      month: m.month,
      change: m.earlyIndex > 0 ? ((m.recentIndex - m.earlyIndex) / m.earlyIndex) * 100 : 0,
    }))
    .filter(m => Math.abs(m.change) > 5)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Format as percentage relative to average (100% = average)
  const formatAsPercent = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-3 shadow-xl">
          <p className="font-bold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const percentValue = Math.round(entry.value * 100);
            const diffFromAvg = percentValue - 100;
            return (
              <div key={index} className="flex flex-col gap-0.5 text-sm mb-1">
                <div className="flex justify-between gap-4">
                  <span style={{ color: entry.color }}>{entry.name}:</span>
                  <span className="font-semibold">{percentValue}%</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {diffFromAvg === 0 ? 'Exatamente na média' : 
                   diffFromAvg > 0 ? `${diffFromAvg}% acima da média` : 
                   `${Math.abs(diffFromAvg)}% abaixo da média`}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (allYears.length < 3) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução do Padrão Sazonal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              São necessários pelo menos 3 anos de dados históricos para analisar a evolução do padrão sazonal.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução do Padrão Sazonal
            <InfoTooltip 
              text="Compara o padrão de sazonalidade dos anos mais antigos com os mais recentes para identificar mudanças no comportamento do negócio." 
              maxWidth={320} 
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparação: {earlyYears.join(', ')} vs {recentYears.join(', ')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Explanation section */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              📊 O que é o Índice de Sazonalidade?
              <InfoTooltip 
                text="O índice mostra quanto cada mês representa em relação à média anual. Exemplo: 120% significa que o mês fatura 20% acima da média, enquanto 80% indica 20% abaixo."
                maxWidth={300}
              />
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O gráfico mostra o <span className="font-medium text-foreground">índice percentual</span> de cada mês, 
              onde <span className="text-primary font-medium">100% = média anual</span>. 
              Valores acima de 100% indicam meses mais fortes; abaixo, meses mais fracos.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-dashed border-t-2 border-muted-foreground"></div>
                <span className="text-muted-foreground">Padrão Antigo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary"></div>
                <span className="text-muted-foreground">Padrão Recente</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={formatAsPercent}
                  tickLine={false}
                  domain={[0.4, 1.8]}
                  ticks={[0.6, 0.8, 1.0, 1.2, 1.4, 1.6]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="earlyIndex" 
                  name={`Padrão Antigo (${earlyYears[0]}-${earlyYears[earlyYears.length - 1]})`}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="recentIndex" 
                  name={`Padrão Recente (${recentYears[0]}-${recentYears[recentYears.length - 1]})`}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {monthChanges.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                Mudanças significativas no padrão
                <InfoTooltip 
                  text="Meses onde o peso sazonal mudou mais de 5% entre os períodos antigo e recente. Isso indica mudanças no comportamento do mercado ou do seu negócio."
                  maxWidth={280}
                />
              </p>
              <div className="flex flex-wrap gap-2">
                {monthChanges.slice(0, 4).map(change => (
                  <div 
                    key={change.month}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      change.change > 0 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {change.change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-medium">{change.month}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{change.change > 0 ? '+' : ''}{change.change.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatternEvolution;
