import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error is caught and set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Decorative colored blobs in background */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-slate-900/5 blur-3xl pointer-events-none" />

      <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full shadow-xl overflow-hidden p-8 relative z-10 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-display font-bold text-2xl mx-auto shadow-md shadow-amber-500/20">
            M
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-4 tracking-tight">MotoJá Admin</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest font-semibold">Painel Administrativo Geral</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold mb-5 animate-in slide-in-from-top-1">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button 
                onClick={clearError} 
                className="text-rose-500 font-bold block mt-1 hover:underline text-[10px]"
              >
                Limpar Erro
              </button>
            </div>
          </div>
        )}

        {/* Real Form Credentials */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: admin@email.com" 
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Chave de Acesso (Senha)</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            {loading ? 'Acessando Banco...' : 'Fazer Login Oficial'}
          </button>
        </form>

        {/* Bottom instructions */}
        <p className="text-[10px] text-center text-slate-400 leading-relaxed mt-6">
          Acesso restrito a administradores cadastrados na plataforma. Caso não possua uma conta, contate o administrador do sistema.
        </p>
      </div>
    </div>
  );
};
