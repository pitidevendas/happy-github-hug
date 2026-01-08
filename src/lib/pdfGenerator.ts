import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export interface ReportData {
  title: string;
  period: string;
  companyName: string;
  generatedAt: string;
  summary: {
    totalRevenue: number;
    totalSales: number;
    avgTicket: number;
    monthlyGoal: number;
    progress: string;
  };
  teamPerformance: {
    name: string;
    revenue: number;
    goal: number;
    progress: string;
    salesCount: number;
  }[];
  insights: string[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function generatePDFReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const darkGray: [number, number, number] = [55, 65, 81];
  const lightGray: [number, number, number] = [156, 163, 175];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 15, 20);

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.companyName} | ${data.period}`, 15, 30);

  // Generated date
  doc.setFontSize(9);
  const generatedDate = new Date(data.generatedAt).toLocaleString('pt-BR');
  doc.text(`Gerado em: ${generatedDate}`, 15, 38);

  // Reset text color
  doc.setTextColor(...darkGray);

  // Summary Section
  let yPos = 55;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Executivo', 15, yPos);
  yPos += 10;

  // Summary cards (simulated as table)
  const summaryData = [
    ['Faturamento Total', formatCurrency(data.summary.totalRevenue)],
    ['Meta do Período', formatCurrency(data.summary.monthlyGoal)],
    ['Progresso', `${data.summary.progress}%`],
    ['Total de Vendas', data.summary.totalSales.toString()],
    ['Ticket Médio', formatCurrency(data.summary.avgTicket)],
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: lightGray, cellWidth: 60 },
      1: { fontStyle: 'bold', textColor: darkGray, halign: 'left' },
    },
    margin: { left: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Progress bar (visual representation)
  const progressValue = Math.min(parseFloat(data.summary.progress), 100);
  const barWidth = 180;
  const barHeight = 8;
  
  doc.setFillColor(229, 231, 235); // Gray background
  doc.roundedRect(15, yPos, barWidth, barHeight, 2, 2, 'F');
  
  const progressWidth = (progressValue / 100) * barWidth;
  if (progressValue >= 100) {
    doc.setFillColor(34, 197, 94); // Green
  } else if (progressValue >= 70) {
    doc.setFillColor(59, 130, 246); // Blue
  } else if (progressValue >= 50) {
    doc.setFillColor(251, 191, 36); // Yellow
  } else {
    doc.setFillColor(239, 68, 68); // Red
  }
  doc.roundedRect(15, yPos, progressWidth, barHeight, 2, 2, 'F');

  yPos += 20;

  // Team Performance Section
  if (data.teamPerformance.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Desempenho da Equipe', 15, yPos);
    yPos += 5;

    const teamTableData = data.teamPerformance.map((member, index) => [
      `${index + 1}º`,
      member.name,
      formatCurrency(member.revenue),
      formatCurrency(member.goal),
      `${member.progress}%`,
      member.salesCount.toString(),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['#', 'Vendedor', 'Faturamento', 'Meta', 'Progresso', 'Vendas']],
      body: teamTableData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 15, right: 15 },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Check if we need a new page for insights
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Insights Section
  if (data.insights.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Insights e Recomendações', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    data.insights.forEach((insight) => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Draw insight box
      doc.setFillColor(239, 246, 255); // Light blue
      doc.setDrawColor(191, 219, 254); // Blue border
      
      const insightHeight = 12;
      doc.roundedRect(15, yPos - 5, pageWidth - 30, insightHeight, 2, 2, 'FD');
      
      doc.setTextColor(...darkGray);
      doc.text(insight, 20, yPos + 3);
      
      yPos += insightHeight + 5;
    });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(
      `Página ${i} de ${pageCount} | Central Inteligente`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadPDF(data: ReportData, filename?: string): void {
  const doc = generatePDFReport(data);
  const defaultFilename = `relatorio-${data.period.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(filename || defaultFilename);
}
