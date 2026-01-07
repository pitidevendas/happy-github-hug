import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, RefreshCw, Sparkles, Clock, TrendingUp, AlertCircle, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExecutiveSummary } from '@/hooks/useExecutiveSummary';
import { DashboardData } from '@/types';
import { toast } from 'sonner';

interface ExecutiveSummaryViewProps {
  data: DashboardData;
}

const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({ data }) => {
  const { summaryData, isLoading, error, generateSummary } = useExecutiveSummary();
  const [copied, setCopied] = React.useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-generate on first load
    if (!summaryData && !isLoading && !error) {
      generateSummary(data);
    }
  }, []);

  const handleRegenerate = () => {
    generateSummary(data);
  };

  const handleCopy = async () => {
    if (summaryData?.summary) {
      await navigator.clipboard.writeText(summaryData.summary);
      setCopied(true);
      toast.success('Sumário copiado para a área de transferência');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!summaryData?.summary) return;

    const blob = new Blob([summaryData.summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sumario-executivo-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sumário baixado com sucesso');
  };

  const formatMarkdown = (text: string) => {
    // Simple markdown to HTML conversion
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-foreground mt-4 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 text-muted-foreground">• $1</li>')
      // Numbered lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-muted-foreground list-decimal">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3 text-muted-foreground">')
      .replace(/\n/g, '<br/>');

    return `<div class="prose prose-sm max-w-none"><p class="mb-3 text-muted-foreground">${html}</p></div>`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sumário Executivo</h1>
            <p className="text-sm text-muted-foreground">Relatório gerado por IA para stakeholders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!summaryData || isLoading}
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!summaryData || isLoading}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar MD
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Gerando...' : 'Regenerar'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso Anual</p>
                <p className="text-lg font-bold text-foreground">{summaryData.metrics.annualProgress.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso Mensal</p>
                <p className="text-lg font-bold text-foreground">{summaryData.metrics.monthProgress.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Clock className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gerado em</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(summaryData.generatedAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Erro ao gerar sumário</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Gerando Sumário Executivo</p>
                <p className="text-sm text-muted-foreground">Analisando dados e criando insights...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Content */}
      {summaryData && !isLoading && (
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Relatório - {data.companyName || 'Empresa'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8" ref={contentRef}>
            <div 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(summaryData.summary) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!summaryData && !isLoading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 rounded-full bg-muted">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Nenhum sumário gerado</p>
                <p className="text-sm text-muted-foreground">Clique em "Regenerar" para criar um novo relatório</p>
              </div>
              <Button onClick={handleRegenerate} className="mt-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Sumário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ExecutiveSummaryView;
