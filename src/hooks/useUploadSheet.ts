import { useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { DashboardData, Salesperson, MonthlyData, SalespersonWeekly, UploadConfig } from "@/types";

interface ProcessedData {
  sheetsFound: string[];
  rowCount: number;
  kpis: DashboardData["kpis"];
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  team: Salesperson[];
  yearsAvailable: number[];
  selectedMonth: string;
  mentorshipStartDate?: string;
}

interface UploadResult {
  success: boolean;
  data?: ProcessedData;
  error?: string;
}

// Mapeamento de meses em português
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthNamesLong = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Converter nome de aba para mês/ano (ex: "Out-25" -> { month: 10, year: 2025 })
const parseTabName = (tabName: string): { month: number; year: number } | null => {
  const match = tabName.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (!match) return null;
  
  const monthAbbr = match[1];
  const yearShort = parseInt(match[2], 10);
  
  const monthIndex = monthNames.findIndex(
    (m) => m.toLowerCase() === monthAbbr.toLowerCase()
  );
  
  if (monthIndex === -1) return null;
  
  return {
    month: monthIndex + 1,
    year: 2000 + yearShort,
  };
};

// Comparar se data1 <= data2
const isBeforeOrEqual = (
  m1: number, y1: number,
  m2: number, y2: number
): boolean => {
  if (y1 < y2) return true;
  if (y1 > y2) return false;
  return m1 <= m2;
};

const useUploadSheet = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const { toast } = useToast();

  // Parser para aba "Geral" - extrai faturamento mensal por ano
  // Estrutura real da planilha Geral:
  // Linha 1 (índice 0): Título/Cabeçalho
  // Linha 2 (índice 1): Anos (2022, 2023, 2024, 2025) nas colunas B, C, D, E
  // Linhas 3-14 (índice 2-13): Meses com faturamento
  // Coluna A: Nomes dos meses
  // Colunas B-E: Faturamento por ano
  // Coluna K (índice 10): Início mentoria
  const parseGeneralSheet = (
    worksheet: XLSX.WorkSheet,
    cutoffMonth: number,
    cutoffYear: number
  ): { historicalData: MonthlyData[]; currentYearData: MonthlyData[]; yearsAvailable: number[]; mentorshipStartDate?: string } => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    console.log("[parseGeneralSheet] Total de linhas:", jsonData.length);
    
    const historicalData: MonthlyData[] = [];
    const currentYearData: MonthlyData[] = [];
    const yearsAvailable: number[] = [];
    let mentorshipStartDate: string | undefined;
    
    // Detectar linha com anos (procurar linha que contém anos como 2022, 2023, 2024, 2025)
    let yearRowIndex = -1;
    const yearColumns: { col: number; year: number }[] = [];
    
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 5); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      for (let col = 1; col < Math.min(row.length, 10); col++) {
        const cellValue = row[col];
        if (typeof cellValue === "number" && cellValue >= 2020 && cellValue <= 2030) {
          if (yearRowIndex === -1) yearRowIndex = rowIdx;
          yearColumns.push({ col, year: cellValue });
          if (!yearsAvailable.includes(cellValue)) {
            yearsAvailable.push(cellValue);
          }
        }
      }
      if (yearColumns.length > 0) break;
    }
    
    console.log("[parseGeneralSheet] Linha de anos encontrada:", yearRowIndex + 1);
    console.log("[parseGeneralSheet] Anos detectados:", yearsAvailable);
    
    // Procurar "Início Mentoria" na planilha
    for (let row = 0; row < Math.min(jsonData.length, 20); row++) {
      for (let col = 0; col < Math.min((jsonData[row] || []).length, 15); col++) {
        const cell = jsonData[row]?.[col];
        if (typeof cell === "string" && cell.toLowerCase().includes("início mentoria")) {
          // A data deve estar na célula adjacente ou abaixo
          const dateCell = jsonData[row]?.[col + 1] || jsonData[row + 1]?.[col];
          if (dateCell) {
            if (typeof dateCell === "number") {
              // Converter número de data Excel
              const date = XLSX.SSF.parse_date_code(dateCell);
              if (date) {
                mentorshipStartDate = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
                console.log("[parseGeneralSheet] Data de mentoria encontrada:", mentorshipStartDate);
              }
            } else if (typeof dateCell === "string") {
              mentorshipStartDate = dateCell;
              console.log("[parseGeneralSheet] Data de mentoria (string):", mentorshipStartDate);
            }
          }
        }
      }
    }
    
    // Extrair faturamento por mês - linhas após a linha de anos
    const dataStartRow = yearRowIndex + 1;
    
    for (let rowIdx = dataStartRow; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row || !row[0]) continue;
      
      const monthCell = String(row[0]).trim();
      
      // Tentar encontrar o índice do mês
      let monthIndex = monthNamesLong.findIndex(
        (m) => monthCell.toLowerCase() === m.toLowerCase()
      );
      
      // Se não encontrou exatamente, tentar prefixo
      if (monthIndex === -1) {
        monthIndex = monthNamesLong.findIndex(
          (m) => monthCell.toLowerCase().startsWith(m.toLowerCase().substring(0, 3))
        );
      }
      
      if (monthIndex === -1) continue;
      
      // Para cada ano detectado, extrair o valor
      for (const { col, year } of yearColumns) {
        const revenueValue = row[col];
        let revenue = 0;
        
        if (typeof revenueValue === "number") {
          revenue = revenueValue;
        } else if (typeof revenueValue === "string") {
          // Limpar string e converter
          const cleanValue = revenueValue.replace(/[R$\s.]/g, "").replace(",", ".");
          revenue = parseFloat(cleanValue) || 0;
        }
        
        // Aplicar corte: ignorar meses após o mês selecionado
        if (!isBeforeOrEqual(monthIndex + 1, year, cutoffMonth, cutoffYear)) {
          continue;
        }
        
        const monthData: MonthlyData = {
          month: monthNames[monthIndex],
          year,
          revenue: revenue || 0,
          goal: 0, // Meta será extraída de outra coluna se existir
        };
        
        // Determinar se é ano atual ou histórico
        const currentYear = new Date().getFullYear();
        if (year === currentYear) {
          currentYearData.push(monthData);
        } else {
          historicalData.push(monthData);
        }
      }
    }
    
    console.log("[parseGeneralSheet] Dados históricos:", historicalData.length, "registros");
    console.log("[parseGeneralSheet] Dados ano atual:", currentYearData.length, "registros");
    
    yearsAvailable.sort();
    
    return { historicalData, currentYearData, yearsAvailable, mentorshipStartDate };
  };

  // Parser para aba mensal (ex: Out-25) - extrai equipe
  // Estrutura real da planilha:
  // Linha 2 (índice 1): Cabeçalho com "CONSULTOR COMERCIAL"
  // Linha 3 (índice 2): Datas das semanas
  // Linhas 4+ (índice 3+): Dados dos vendedores
  // Coluna A (0): Número do vendedor
  // Coluna B (1): Nome do vendedor (CONSULTOR COMERCIAL)
  // Coluna C (2): Previsto diário
  // Coluna D (3): Previsto semanal
  // Coluna E (4): Semana 1 valor
  // Coluna G (6): Semana 2 valor
  // Coluna I (8): Semana 3 valor
  // Coluna K (10): Semana 4 valor
  // Coluna M (12): Semana 5 valor
  // Coluna P (15): Resultado (totalRevenue)
  // Coluna R (17): Meta Projetada (monthlyGoal)
  const parseMonthlyTab = (worksheet: XLSX.WorkSheet): Salesperson[] => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    const team: Salesperson[] = [];
    
    console.log("[parseMonthlyTab] Total de linhas:", jsonData.length);
    
    // Índices das colunas baseado na estrutura real
    const COL_NUMERO = 0;        // Coluna A - Número do vendedor
    const COL_NOME = 1;          // Coluna B - Nome do vendedor
    const COL_PREVISTO_DIARIO = 2;  // Coluna C
    const COL_PREVISTO_SEMANAL = 3; // Coluna D
    const COL_SEMANA_1 = 4;      // Coluna E
    const COL_SEMANA_2 = 6;      // Coluna G
    const COL_SEMANA_3 = 8;      // Coluna I
    const COL_SEMANA_4 = 10;     // Coluna K
    const COL_SEMANA_5 = 12;     // Coluna M
    const COL_RESULTADO = 15;    // Coluna P - Resultado final
    const COL_META = 17;         // Coluna R - Meta Projetada
    
    const weekColumns = [COL_SEMANA_1, COL_SEMANA_2, COL_SEMANA_3, COL_SEMANA_4, COL_SEMANA_5];
    
    // Encontrar a linha do cabeçalho "CONSULTOR COMERCIAL"
    let headerRowIndex = -1;
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 10); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      const cell = String(row[COL_NOME] || "").toLowerCase();
      if (cell.includes("consultor") || cell.includes("comercial")) {
        headerRowIndex = rowIdx;
        console.log("[parseMonthlyTab] Cabeçalho encontrado na linha:", rowIdx + 1);
        break;
      }
    }
    
    // Se não encontrou cabeçalho, assumir linha 1 (índice 1)
    if (headerRowIndex === -1) {
      headerRowIndex = 1;
      console.log("[parseMonthlyTab] Cabeçalho não encontrado, usando linha 2");
    }
    
    // Dados dos vendedores começam após a linha de datas (cabeçalho + 2)
    const dataStartRow = headerRowIndex + 2;
    console.log("[parseMonthlyTab] Dados começam na linha:", dataStartRow + 1);
    
    // Processar cada linha de vendedor
    for (let rowIdx = dataStartRow; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row) continue;
      
      const nameCell = row[COL_NOME];
      
      // Validar nome do vendedor
      if (!nameCell || typeof nameCell !== "string") continue;
      
      const name = nameCell.trim();
      
      // Ignorar linhas vazias, totais, ou cabeçalhos
      if (!name) continue;
      if (name.toLowerCase() === "total") {
        console.log("[parseMonthlyTab] Linha de total encontrada, parando na linha:", rowIdx + 1);
        break;
      }
      if (name.toLowerCase().includes("consultor")) continue;
      if (name.toLowerCase().includes("comercial")) continue;
      
      // Verificar se a coluna A tem um número (indicando que é um vendedor válido)
      const numCell = row[COL_NUMERO];
      const isValidSalesperson = typeof numCell === "number" || 
        (typeof numCell === "string" && /^\d+$/.test(numCell.trim()));
      
      if (!isValidSalesperson) {
        console.log("[parseMonthlyTab] Linha ignorada (sem número):", name);
        continue;
      }
      
      // Extrair valores das semanas
      const weeks: SalespersonWeekly[] = [];
      let totalWeeklyRevenue = 0;
      
      for (let weekNum = 0; weekNum < weekColumns.length; weekNum++) {
        const weekCol = weekColumns[weekNum];
        const weekValue = row[weekCol];
        const revenue = typeof weekValue === "number" ? weekValue : 
          (typeof weekValue === "string" ? parseFloat(weekValue.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0);
        
        totalWeeklyRevenue += revenue;
        weeks.push({
          week: weekNum + 1,
          revenue,
          goal: 0,
        });
      }
      
      // Extrair resultado (Coluna P) e meta (Coluna R)
      const resultadoCell = row[COL_RESULTADO];
      const totalRevenue = typeof resultadoCell === "number" ? resultadoCell :
        (typeof resultadoCell === "string" ? parseFloat(resultadoCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || totalWeeklyRevenue : totalWeeklyRevenue);
      
      const metaCell = row[COL_META];
      const monthlyGoal = typeof metaCell === "number" ? metaCell :
        (typeof metaCell === "string" ? parseFloat(metaCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0);
      
      console.log(`[parseMonthlyTab] Vendedor: ${name}, Resultado: ${totalRevenue}, Meta: ${monthlyGoal}`);
      
      team.push({
        id: String(team.length + 1),
        name,
        avatar: "",
        totalRevenue,
        monthlyGoal,
        active: true,
        weeks,
        totalSalesCount: 0,
      });
    }
    
    console.log("[parseMonthlyTab] Total de vendedores encontrados:", team.length);
    return team;
  };

  // Calcular KPIs baseados nos dados extraídos
  const calculateKPIs = (
    historicalData: MonthlyData[],
    currentYearData: MonthlyData[],
    team: Salesperson[],
    cutoffMonth: number,
    cutoffYear: number,
    mentorshipStartDate?: string
  ): DashboardData["kpis"] => {
    const currentMonth = monthNamesLong[cutoffMonth - 1];
    
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);
    const annualRealized = currentYearData.reduce((sum, m) => sum + m.revenue, 0);
    
    // Calcular crescimento em relação ao ano anterior
    const lastYear = cutoffYear - 1;
    const lastYearData = historicalData.filter((m) => m.year === lastYear);
    const lastYearTotal = lastYearData.reduce((sum, m) => sum + m.revenue, 0);
    const lastYearGrowth = lastYearTotal > 0 ? ((annualRealized - lastYearTotal) / lastYearTotal) * 100 : 0;
    
    // Calcular crescimento pós-mentoria
    let mentorshipGrowth = 0;
    if (mentorshipStartDate) {
      const mentorshipDate = new Date(mentorshipStartDate);
      const mentorshipYear = mentorshipDate.getFullYear();
      const mentorshipMonth = mentorshipDate.getMonth() + 1;
      
      // Faturamento pré-mentoria (12 meses anteriores)
      const allData = [...historicalData, ...currentYearData];
      let preMentorshipRevenue = 0;
      let postMentorshipRevenue = 0;
      
      for (const monthData of allData) {
        const monthIndex = monthNames.indexOf(monthData.month) + 1;
        if (isBeforeOrEqual(monthIndex, monthData.year, mentorshipMonth, mentorshipYear)) {
          preMentorshipRevenue += monthData.revenue;
        } else if (isBeforeOrEqual(monthIndex, monthData.year, cutoffMonth, cutoffYear)) {
          postMentorshipRevenue += monthData.revenue;
        }
      }
      
      if (preMentorshipRevenue > 0) {
        mentorshipGrowth = ((postMentorshipRevenue - preMentorshipRevenue) / preMentorshipRevenue) * 100;
      }
    }
    
    const totalSalesCount = team.reduce((sum, t) => sum + t.totalSalesCount, 0);
    const activeCustomers = team.filter((t) => t.active).length * 50;
    
    return {
      annualGoal,
      annualRealized,
      lastYearGrowth: Math.round(lastYearGrowth * 10) / 10,
      mentorshipGrowth: Math.round(mentorshipGrowth * 10) / 10,
      currentMonthName: currentMonth,
      averageTicket: totalSalesCount > 0 ? Math.round(annualRealized / totalSalesCount) : 0,
      conversionRate: 0,
      cac: 0,
      ltv: 0,
      activeCustomers,
      totalSalesCount,
    };
  };

  const processFile = async (file: File, config: UploadConfig): Promise<UploadResult> => {
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      const sheetsFound = workbook.SheetNames;
      let rowCount = 0;
      
      let historicalData: MonthlyData[] = [];
      let currentYearData: MonthlyData[] = [];
      let team: Salesperson[] = [];
      let yearsAvailable: number[] = [];
      let mentorshipStartDate: string | undefined;
      
      const { selectedMonth, selectedYear } = config;
      const selectedMonthAbbr = monthNames[selectedMonth - 1];
      const selectedYearShort = String(selectedYear).slice(-2);
      const selectedTabName = `${selectedMonthAbbr}-${selectedYearShort}`;
      
      // Processar aba "Geral"
      const geralSheet = workbook.Sheets["Geral"] || workbook.Sheets["geral"] || workbook.Sheets["GERAL"];
      if (geralSheet) {
        const geralData = parseGeneralSheet(geralSheet, selectedMonth, selectedYear);
        historicalData = geralData.historicalData;
        currentYearData = geralData.currentYearData;
        yearsAvailable = geralData.yearsAvailable;
        mentorshipStartDate = geralData.mentorshipStartDate;
        
        const jsonData = XLSX.utils.sheet_to_json(geralSheet, { header: 1 }) as any[][];
        rowCount += jsonData.length - 1;
      }
      
      // Processar aba do mês selecionado para extrair equipe
      const monthlySheet = workbook.Sheets[selectedTabName];
      if (monthlySheet) {
        team = parseMonthlyTab(monthlySheet);
        const jsonData = XLSX.utils.sheet_to_json(monthlySheet, { header: 1 }) as any[][];
        rowCount += jsonData.length - 1;
      } else {
        // Tentar encontrar a aba mais próxima
        for (const sheetName of sheetsFound) {
          const parsed = parseTabName(sheetName);
          if (parsed && isBeforeOrEqual(parsed.month, parsed.year, selectedMonth, selectedYear)) {
            const sheet = workbook.Sheets[sheetName];
            team = parseMonthlyTab(sheet);
            break;
          }
        }
      }
      
      const kpis = calculateKPIs(
        historicalData,
        currentYearData,
        team,
        selectedMonth,
        selectedYear,
        mentorshipStartDate
      );
      
      const data: ProcessedData = {
        sheetsFound,
        rowCount,
        kpis,
        historicalData,
        currentYearData,
        team,
        yearsAvailable,
        selectedMonth: selectedTabName,
        mentorshipStartDate,
      };
      
      setProcessedData(data);
      setIsProcessing(false);
      
      return { success: true, data };
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      return {
        success: false,
        error: "Erro ao processar o arquivo. Verifique se o formato está correto.",
      };
    }
  };

  const detectAvailableMonths = async (file: File): Promise<{ month: number; year: number; tabName: string }[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      const availableMonths: { month: number; year: number; tabName: string }[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const parsed = parseTabName(sheetName);
        if (parsed) {
          availableMonths.push({
            ...parsed,
            tabName: sheetName,
          });
        }
      }
      
      // Ordenar por data (mais recente primeiro)
      availableMonths.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      return availableMonths;
    } catch (error) {
      console.error("Error detecting months:", error);
      return [];
    }
  };

  const reset = () => {
    setProcessedData(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    processedData,
    processFile,
    detectAvailableMonths,
    reset,
  };
};

export default useUploadSheet;
