import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Student {
  id: string;
  email: string;
  status: 'pending' | 'registered';
  companyName?: string;
  segment?: string;
  registeredAt?: string;
  createdAt: string;
  // Dados consolidados do aluno
  dashboardSummary?: {
    annualGoal?: number;
    annualRealized?: number;
    teamSize?: number;
    lastUploadDate?: string;
  };
}

interface UseStudentsReturn {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  inviteStudent: (email: string) => Promise<boolean>;
  removeInvite: (inviteId: string) => Promise<boolean>;
  fetchStudents: () => Promise<void>;
}

export default function useStudents(userId: string | undefined): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Buscar convites criados pelo consultor
      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      // Para cada convite registrado, buscar dados do profile e dashboard
      const studentsWithData: Student[] = await Promise.all(
        (invites || []).map(async (invite) => {
          let dashboardSummary = undefined;
          let profileData = undefined;

          if (invite.status === 'registered' && invite.registered_uid) {
            // Buscar profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_name, segment')
              .eq('id', invite.registered_uid)
              .maybeSingle();

            profileData = profile;

            // Buscar resumo do dashboard
            const { data: dashboard } = await supabase
              .from('dashboard_data')
              .select('kpis, team, last_upload_date')
              .eq('user_id', invite.registered_uid)
              .maybeSingle();

            if (dashboard) {
              const kpis = dashboard.kpis as any;
              const team = dashboard.team as any[];
              dashboardSummary = {
                annualGoal: kpis?.annualGoal,
                annualRealized: kpis?.annualRealized,
                teamSize: team?.length || 0,
                lastUploadDate: dashboard.last_upload_date,
              };
            }
          }

          return {
            id: invite.id,
            email: invite.email,
            status: invite.status as 'pending' | 'registered',
            companyName: profileData?.company_name || undefined,
            segment: profileData?.segment || undefined,
            createdAt: invite.created_at,
            dashboardSummary,
          };
        })
      );

      setStudents(studentsWithData);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const inviteStudent = useCallback(async (email: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      // Verificar se já existe convite para este email
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('created_by', userId)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Convite já existe',
          description: 'Este email já foi convidado.',
          variant: 'destructive',
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('invites')
        .insert({
          email: email.toLowerCase(),
          created_by: userId,
          role: 'business_owner',
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Convite enviado!',
        description: `Convite enviado para ${email}`,
      });

      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error('Error inviting student:', err);
      setError(err.message || 'Erro ao enviar convite');
      toast({
        title: 'Erro ao enviar convite',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, fetchStudents]);

  const removeInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)
        .eq('created_by', userId);

      if (deleteError) throw deleteError;

      setStudents(prev => prev.filter(s => s.id !== inviteId));

      toast({
        title: 'Convite removido',
        description: 'O convite foi removido com sucesso.',
      });

      return true;
    } catch (err: any) {
      console.error('Error removing invite:', err);
      setError(err.message || 'Erro ao remover convite');
      toast({
        title: 'Erro ao remover convite',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) {
      fetchStudents();
    }
  }, [userId, fetchStudents]);

  return {
    students,
    isLoading,
    error,
    inviteStudent,
    removeInvite,
    fetchStudents,
  };
}
