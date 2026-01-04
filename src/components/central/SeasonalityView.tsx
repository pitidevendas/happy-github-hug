import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from "recharts";

interface SeasonalityViewProps {
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
}

const SeasonalityView = ({ historicalData, currentYearData }: SeasonalityViewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
  };

  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Get all unique years from historical data
  const allYears = [...new Set(historicalData.map(d => d.year))].sort();
  const currentYear = currentYearData[0]?.year || new Date().getFullYear();

  // Calculate seasonal pattern: average revenue per month across ALL historical years
  const seasonalPattern = monthOrder.map(month => {
    const allMonthData = historicalData.filter(d => d.month === month);
    const avgRevenue = allMonthData.length > 0
      ? allMonthData.reduce((sum, d) => sum + d.revenue, 0) / allMonthData.length
      : 0;
    
    return {
      month,
      avgRevenue,
      yearsCount: allMonthData.length,
    };
  });

  // Calculate global average for seasonality index
  const globalAvgRevenue = seasonalPattern.reduce((sum, m) => sum + m.avgRevenue, 0) / 
    seasonalPattern.filter(m => m.avgRevenue > 0).length || 1;

  // Calculate seasonality index for each month
  const seasonalityData = seasonalPattern.map(m => ({
    ...m,
    index: m.avgRevenue > 0 ? (m.avgRevenue / globalAvgRevenue) : 0,
    isStrong: m.avgRevenue > globalAvgRevenue,
    variation: ((m.avgRevenue - globalAvgRevenue) / globalAvgRevenue) * 100,
  }));

  // Best and worst months based on historical average
  const monthsWithData = seasonalityData.filter(m => m.avgRevenue > 0);
  const strongestMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((prev, curr) => curr.index > prev.index ? curr : prev)
    : null;
  const weakestMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((prev, curr) => curr.index < prev.index ? curr : prev)
    : null;

  // Forecast: project remaining months based on seasonality pattern
  const completedMonths = currentYearData.filter(d => d.revenue > 0);
  const lastCompletedMonthIndex = completedMonths.length > 0
    ? monthOrder.indexOf(completedMonths[completedMonths.length - 1].month)
    : -1;

  // Calculate current year's average performance vs historical
  const currentYearPerformance = completedMonths.length > 0
    ? completedMonths.reduce((sum, d) => {
        const historicalAvg = seasonalityData.find(s => s.month === d.month)?.avgRevenue || d.revenue;
        return sum + (d.revenue / historicalAvg);
      }, 0) / completedMonths.length
    : 1;

  // Forecast data: actual + projected
  const forecastData = monthOrder.map((month, index) => {
    const current = currentYearData.find(d => d.month === month);
    const seasonal = seasonalityData.find(s => s.month === month);
    const isCompleted = index <= lastCompletedMonthIndex;
    
    return {
      month,
      actual: current?.revenue || 0,
      historicalAvg: seasonal?.avgRevenue || 0,
      projected: !isCompleted && seasonal ? seasonal.avgRevenue * currentYearPerformance : null,
      isCompleted,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[180px]">
          <p className="font-bold text-foreground mb-2 pb-2 border-b border-border">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-sm py-1">
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {data?.index && (
            <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-border">
              <span className="text-muted-foreground">Índice Sazonal:</span>
              <span className={`font-bold ${data.index >= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {data.index.toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anos Históricos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {allYears.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {allYears[0]} a {allYears[allYears.length - 1] || currentYear}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Mensal Histórica
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCompact(globalAvgRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em {allYears.length} anos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {strongestMonth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mês Mais Forte
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {strongestMonth.month}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Índice: {strongestMonth.index.toFixed(2)}x (+{strongestMonth.variation.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {weakestMonth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mês Mais Fraco
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {weakestMonth.month}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Índice: {weakestMonth.index.toFixed(2)}x ({weakestMonth.variation.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Seasonality Index Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Índice de Sazonalidade
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Índice &gt; 1.0 = mês naturalmente forte | Índice &lt; 1.0 = mês naturalmente fraco
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={seasonalityData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(val) => `${val.toFixed(1)}x`}
                  />
                  <ReferenceLine 
                    y={1} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="8 4" 
                    strokeWidth={2}
                    label={{ 
                      value: 'Média (1.0x)', 
                      position: 'right',
                      fill: 'hsl(var(--primary))',
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="index" 
                    name="Índice" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  >
                    {seasonalityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.index >= 1 ? '#10b981' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">Acima da média (naturalmente forte)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Abaixo da média (oportunidade)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Historical Average Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Padrão Histórico de Receita
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Média de receita por mês considerando todos os anos históricos
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={seasonalityData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAvgRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={globalAvgRevenue} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="6 3" 
                    strokeWidth={1}
                    opacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgRevenue"
                    name="Média Histórica"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorAvgRevenue)"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forecast Based on Seasonality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Previsão Baseada em Sazonalidade
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Projeção dos próximos meses baseada no padrão histórico e desempenho atual ({(currentYearPerformance * 100).toFixed(0)}% vs histórico)
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecastData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name={`Realizado ${currentYear}`}
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorActual)"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="Projeção"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorProjected)"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="historicalAvg"
                    name="Média Histórica"
                    stroke="hsl(var(--muted-foreground))"
                    fillOpacity={0}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span className="text-xs font-medium text-muted-foreground">Realizado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #f59e0b 4px, #f59e0b 8px)' }} />
                <span className="text-xs font-medium text-muted-foreground">Projeção Sazonal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-muted-foreground" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, hsl(var(--muted-foreground)) 2px, hsl(var(--muted-foreground)) 4px)' }} />
                <span className="text-xs font-medium text-muted-foreground">Média Histórica</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SeasonalityView;
