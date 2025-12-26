import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Lock, Mail, AlertTriangle, ScanFace, ChevronRight } from 'lucide-react';

const LoginView: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');

  const simulateLoadingSequence = async (callback: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    const stages = ["CALIBRANDO REDE NEURAL...", "VALIDANDO HASH...", "SINCRONIZANDO BI...", "ACESSO PERMITIDO"];
    for (const stage of stages) {
      setLoadingStage(stage);
      await new Promise(r => setTimeout(r, 400));
    }
    try {
      await callback();
    } catch (err: any) {
      let msg = "ACESSO NEGADO PELA REDE.";
      if (err.message?.includes('Invalid login')) msg = "CREDENCIAIS INVÁLIDAS.";
      else if (err.message?.includes('User already registered')) msg = "USUÁRIO JÁ CADASTRADO.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await simulateLoadingSequence(async () => {
      if (isRegistering) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-300 font-sans overflow-hidden">
      <div className="hidden lg:flex w-[60%] relative overflow-hidden border-r border-white/5 items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl">
            <span className="text-5xl font-black text-white">CI</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Central Inteligente</h2>
          <p className="text-slate-400 max-w-md">Plataforma de Business Intelligence para mentorias e consultoria de vendas</p>
        </div>
      </div>

      <div className="w-full lg:w-[40%] bg-slate-950 flex flex-col justify-center items-center p-8 lg:p-16 relative z-30">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800/50 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Sistema v2.1 Online
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {isRegistering ? 'Criar Conta' : 'Acessar'} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Central Inteligente</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3 animate-shake">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-red-300 font-mono">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                    placeholder="seu.email@empresa.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                    placeholder="••••••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 relative overflow-hidden group
                ${loading ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-950 hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]'}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <ScanFace className="animate-spin" size={16} />
                  {loadingStage}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isRegistering ? 'CRIAR CONTA' : 'INICIAR SESSÃO'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="text-slate-500 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 mx-auto group"
            >
              {isRegistering ? (
                <><ChevronRight size={12} className="group-hover:-translate-x-1 transition-transform"/> Voltar para Login</>
              ) : (
                <>Não tem conta? <span className="text-cyan-400 border-b border-cyan-400/30 group-hover:border-cyan-400 pb-0.5">Criar agora</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
