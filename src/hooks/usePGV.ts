import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PGVWeek {
  id: string;
  user_id: string;
  month: number;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  working_days: number;
  monthly_goal: number;
  created_at: string;
  updated_at: string;
}

export interface PGVEntry {
  id: string;
  pgv_week_id: string;
  user_id: string;
  salesperson_id: string;
  salesperson_name: string;
  daily_goal: number;
  weekly_goal: number;
  weekly_realized: number;
  monthly_accumulated: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePGVWeekInput {
  month: number;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  working_days?: number;
  monthly_goal: number;
}

export interface CreatePGVEntryInput {
  pgv_week_id: string;
  salesperson_id: string;
  salesperson_name: string;
  daily_goal: number;
  weekly_goal: number;
  weekly_realized?: number;
  monthly_accumulated?: number;
}

export const usePGV = (month?: number, year?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch PGV weeks for a specific month/year
  const { data: weeks = [], isLoading: weeksLoading } = useQuery({
    queryKey: ['pgv-weeks', user?.id, month, year],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('pgv_weeks')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });

      if (month !== undefined) query = query.eq('month', month);
      if (year !== undefined) query = query.eq('year', year);

      const { data, error } = await query;
      if (error) throw error;
      return data as PGVWeek[];
    },
    enabled: !!user?.id,
  });

  // Fetch entries for all weeks
  const weekIds = weeks.map(w => w.id);
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['pgv-entries', weekIds],
    queryFn: async () => {
      if (weekIds.length === 0) return [];

      const { data, error } = await supabase
        .from('pgv_entries')
        .select('*')
        .in('pgv_week_id', weekIds)
        .order('weekly_realized', { ascending: false });

      if (error) throw error;
      return data as PGVEntry[];
    },
    enabled: weekIds.length > 0,
  });

  // Create PGV week
  const createWeekMutation = useMutation({
    mutationFn: async (input: CreatePGVWeekInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pgv_weeks')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pgv-weeks'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar semana PGV: ' + error.message);
    },
  });

  // Create PGV entry
  const createEntryMutation = useMutation({
    mutationFn: async (input: CreatePGVEntryInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pgv_entries')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pgv-entries'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar lançamento: ' + error.message);
    },
  });

  // Update PGV entry (for editing realized values)
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PGVEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('pgv_entries')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pgv-entries'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lançamento: ' + error.message);
    },
  });

  // Upsert entry (create or update)
  const upsertEntryMutation = useMutation({
    mutationFn: async (input: CreatePGVEntryInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pgv_entries')
        .upsert(
          { ...input, user_id: user.id },
          { onConflict: 'pgv_week_id,salesperson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pgv-entries'] });
      toast.success('Valor atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Get entries for a specific week
  const getEntriesByWeek = (weekId: string) => {
    return entries.filter(e => e.pgv_week_id === weekId);
  };

  // Calculate totals for a week
  const getWeekTotals = (weekId: string) => {
    const weekEntries = getEntriesByWeek(weekId);
    return {
      totalGoal: weekEntries.reduce((sum, e) => sum + e.weekly_goal, 0),
      totalRealized: weekEntries.reduce((sum, e) => sum + e.weekly_realized, 0),
    };
  };

  return {
    weeks,
    entries,
    isLoading: weeksLoading || entriesLoading,
    createWeek: createWeekMutation.mutate,
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    upsertEntry: upsertEntryMutation.mutate,
    isUpdating: updateEntryMutation.isPending || upsertEntryMutation.isPending,
    getEntriesByWeek,
    getWeekTotals,
  };
};
