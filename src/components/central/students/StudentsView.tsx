import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useStudents, { Student } from '@/hooks/useStudents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Building2, 
  Calendar,
  TrendingUp,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentsViewProps {
  onViewStudent?: (studentId: string) => void;
}

export default function StudentsView({ onViewStudent }: StudentsViewProps) {
  const { user } = useAuth();
  const { students, isLoading, inviteStudent, removeInvite, fetchStudents } = useStudents(user?.id);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    const success = await inviteStudent(inviteEmail.trim());
    if (success) {
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const registeredCount = students.filter(s => s.status === 'registered').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const getProgressPercent = (realized?: number, goal?: number) => {
    if (!realized || !goal || goal === 0) return 0;
    return Math.min((realized / goal) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Gestão de Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus alunos e acompanhe o desempenho de cada um
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchStudents()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Aluno</DialogTitle>
                <DialogDescription>
                  Envie um convite para o email do seu aluno. Ele poderá criar uma conta e você terá acesso aos dados dele.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={isLoading || !inviteEmail.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-3xl font-bold text-foreground">{students.length}</p>
              </div>
              <Users className="w-10 h-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-3xl font-bold text-emerald-500">{registeredCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por email ou empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Alunos</CardTitle>
          <CardDescription>
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && students.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {students.length === 0 
                  ? 'Nenhum aluno cadastrado ainda' 
                  : 'Nenhum aluno encontrado com essa busca'}
              </p>
              {students.length === 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convidar primeiro aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso Anual</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Último Upload</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <StudentRow 
                      key={student.id} 
                      student={student}
                      onRemove={removeInvite}
                      onView={onViewStudent}
                      formatCurrency={formatCurrency}
                      getProgressPercent={getProgressPercent}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StudentRowProps {
  student: Student;
  onRemove: (id: string) => Promise<boolean>;
  onView?: (id: string) => void;
  formatCurrency: (value?: number) => string;
  getProgressPercent: (realized?: number, goal?: number) => number;
}

function StudentRow({ student, onRemove, onView, formatCurrency, getProgressPercent }: StudentRowProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(student.id);
    setIsRemoving(false);
  };

  const progress = getProgressPercent(
    student.dashboardSummary?.annualRealized,
    student.dashboardSummary?.annualGoal
  );

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{student.email}</span>
          {student.companyName && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {student.companyName}
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {student.status === 'registered' ? (
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )}
      </TableCell>
      
      <TableCell>
        {student.status === 'registered' && student.dashboardSummary?.annualGoal ? (
          <div className="min-w-[120px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {formatCurrency(student.dashboardSummary.annualRealized)}
              </span>
              <span className="text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  progress >= 80 ? 'bg-emerald-500' : 
                  progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell>
        {student.dashboardSummary?.teamSize !== undefined ? (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            {student.dashboardSummary.teamSize}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell>
        {student.dashboardSummary?.lastUploadDate ? (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(student.dashboardSummary.lastUploadDate), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {student.status === 'registered' && onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(student.id)}
              title="Ver dados"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                title="Remover convite"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover aluno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá o convite de {student.email}. 
                  {student.status === 'registered' && ' Você perderá acesso aos dados deste aluno.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Remover'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
