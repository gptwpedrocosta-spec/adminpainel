import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginView } from './LoginView';
import { ShieldAlert, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, admin, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-display font-bold text-xl animate-bounce shadow-lg shadow-amber-500/20">
          M
        </div>
        <h3 className="font-display font-bold mt-4 text-sm tracking-wider uppercase text-amber-400">MotoJá Admin</h3>
        <p className="text-xs text-slate-400 font-mono mt-1 animate-pulse">Autenticando sessão com o Firestore...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {/* Decorative background blobs */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-slate-900/5 blur-3xl pointer-events-none" />

        <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full shadow-xl p-8 text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider font-semibold">Perfil Não Autorizado</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Seu endereço de email (<strong className="text-slate-700">{user.email}</strong>) foi autenticado, mas não possui um perfil de administrador ativo no banco de dados Firestore.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-400 font-mono leading-relaxed">
            Caso você seja um gestor do sistema, certifique-se de que seu UID (<span className="text-slate-600 font-bold select-all">{user.uid}</span>) está cadastrado na coleção <strong className="text-slate-600 font-bold">admins</strong>.
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sair da Sessão</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
