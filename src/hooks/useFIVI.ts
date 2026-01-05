import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FIVISession {
  id: string;
  user_id: string;
  salesperson_id: string;
  salesperson_name: string;
  date: string;
  week_number: number;
  actions_executed?: string;
  improvement_ideas?: string;
  failed_actions?: string;
  support_needed?: string;
  weekly_commitment: number;
  weekly_goal: number;
  weekly_realized: number;
  previous_commitment?: number;
  previous_realized?: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateFIVIInput {
  salesperson_id: string;
  salesperson_name: string;
  date?: string;
  week_number: number;
  actions_executed?: string;
  improvement_ideas?: string;
  failed_actions?: string;
  support_needed?: string;
  weekly_commitment: number;
  weekly_goal: number;
  weekly_realized: number;
  previous_commitment?: number;
  previous_realized?: number;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

export const useFIVI = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all FIVI sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['fivi-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('fivi_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as FIVISession[];
    },
    enabled: !!user?.id,
  });

  // Create FIVI session
  const createMutation = useMutation({
    mutationFn: async (input: CreateFIVIInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('fivi_sessions')
        .insert({
          ...input,
          user_id: user.id,
          status: input.status || 'completed',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar FIVI: ' + error.message);
    },
  });

  // Update FIVI session
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<FIVISession> & { id: string }) => {
      const { data, error } = await supabase
        .from('fivi_sessions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar FIVI: ' + error.message);
    },
  });

  // Delete FIVI session
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fivi_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir FIVI: ' + error.message);
    },
  });

  // Get sessions for a specific salesperson
  const getSessionsBySalesperson = (salespersonId: string) => {
    return sessions.filter(s => s.salesperson_id === salespersonId);
  };

  // Get latest session for a salesperson
  const getLatestSession = (salespersonId: string) => {
    const salespersonSessions = getSessionsBySalesperson(salespersonId);
    return salespersonSessions[0];
  };

  // Get sessions for a specific week
  const getSessionsByWeek = (weekNumber: number) => {
    return sessions.filter(s => s.week_number === weekNumber);
  };

  // Calculate commitment fulfillment rate
  const getCommitmentRate = () => {
    const completedSessions = sessions.filter(s => 
      s.status === 'completed' && 
      s.previous_commitment !== undefined && 
      s.previous_realized !== undefined
    );
    
    if (completedSessions.length === 0) return 0;

    const fulfilled = completedSessions.filter(s => 
      (s.previous_realized || 0) >= (s.previous_commitment || 0)
    ).length;

    return (fulfilled / completedSessions.length) * 100;
  };

  // Get pending FIVIs for current week
  const getPendingFIVIs = (teamIds: string[], currentWeek: number) => {
    const completedThisWeek = sessions
      .filter(s => s.week_number === currentWeek && s.status === 'completed')
      .map(s => s.salesperson_id);

    return teamIds.filter(id => !completedThisWeek.includes(id));
  };

  return {
    sessions,
    isLoading,
    error,
    createFIVI: createMutation.mutate,
    updateFIVI: updateMutation.mutate,
    deleteFIVI: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    getSessionsBySalesperson,
    getLatestSession,
    getSessionsByWeek,
    getCommitmentRate,
    getPendingFIVIs,
  };
};
