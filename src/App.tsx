import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import LoginView from "@/components/central/LoginView";
import DashboardView from "@/components/central/DashboardView";
import { DashboardData } from "@/types";

const queryClient = new QueryClient();

// Dados de demonstração
const demoData: DashboardData = {
  companyName: "Empresa Demo",
  businessSegment: "Varejo",
  kpis: {
    annualGoal: 2400000,
    annualRealized: 1850000,
    lastYearGrowth: 23.5,
    mentorshipGrowth: 15,
    currentMonthName: "Dezembro",
    averageTicket: 1250,
    conversionRate: 32.5,
    cac: 180,
    ltv: 4500,
    activeCustomers: 342,
    totalSalesCount: 1480,
  },
  historicalData: [
    { month: "Jan", year: 2024, revenue: 180000, goal: 200000 },
    { month: "Fev", year: 2024, revenue: 165000, goal: 200000 },
    { month: "Mar", year: 2024, revenue: 210000, goal: 200000 },
  ],
  currentYearData: [
    { month: "Jan", year: 2025, revenue: 220000, goal: 200000 },
    { month: "Fev", year: 2025, revenue: 195000, goal: 200000 },
    { month: "Mar", year: 2025, revenue: 240000, goal: 200000 },
    { month: "Abr", year: 2025, revenue: 185000, goal: 200000 },
    { month: "Mai", year: 2025, revenue: 260000, goal: 200000 },
    { month: "Jun", year: 2025, revenue: 230000, goal: 200000 },
    { month: "Jul", year: 2025, revenue: 0, goal: 200000 },
    { month: "Ago", year: 2025, revenue: 0, goal: 200000 },
    { month: "Set", year: 2025, revenue: 0, goal: 200000 },
    { month: "Out", year: 2025, revenue: 0, goal: 200000 },
    { month: "Nov", year: 2025, revenue: 0, goal: 200000 },
    { month: "Dez", year: 2025, revenue: 520000, goal: 200000 },
  ],
  team: [],
};

const AuthenticatedApp = () => {
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central Inteligente</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo, {user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            Sair
          </button>
        </div>
        <DashboardView data={demoData} />
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest">
        INICIANDO SISTEMA...
      </div>
    );
  }

  return user ? (
    <ClientProvider>
      <AuthenticatedApp />
    </ClientProvider>
  ) : (
    <LoginView />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
