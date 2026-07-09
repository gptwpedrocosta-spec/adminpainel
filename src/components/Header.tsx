import React, { useState } from 'react';
import { Menu, Search, Bell, Plus, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  onNewRideClick: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  onNewRideClick,
  activeView
}) => {
  const { adminProfile } = useAuth();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Translate view name to title
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Resumo Geral';
      case 'users': return 'Gestão de Usuários';
      case 'drivers': return 'Gestão de Motoristas';
      case 'rides': return 'Monitoramento de Corridas';
      case 'deliveries': return 'Monitoramento de Entregas';
      case 'financial': return 'Demonstrativo Financeiro';
      case 'map': return 'Painel de Despacho (Live)';
      case 'notifications': return 'Disparar Push Notifications';
      case 'settings': return 'Configurações do Sistema';
      default: return 'Painel Administrativo';
    }
  };

  const notifications = [
    { id: 1, text: 'Novo motorista Ricardo Ramos solicita aprovação.', time: '5m atrás', type: 'driver' },
    { id: 2, text: 'Corrida #ride_3 aguardando motorista há mais de 5 minutos.', time: '12m atrás', type: 'ride' },
    { id: 3, text: 'Relatório financeiro do mês gerado com sucesso.', time: '1h atrás', type: 'system' }
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">MotoJá Admin</span>
          <h1 className="font-display font-bold text-lg text-slate-800 leading-tight">{getViewTitle()}</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative max-w-xs hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar corridas, motoristas..." 
            className="w-56 pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
          />
        </div>

        {/* Action Button */}
        <button 
          onClick={onNewRideClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={14} className="stroke-[3px]" />
          <span className="hidden xs:inline">Nova Corrida</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
          </button>

          {showNotificationDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotificationDropdown(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-150 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-display font-semibold text-xs text-slate-800">Notificações Recentes</span>
                  <span className="text-[10px] text-amber-500 font-medium hover:underline cursor-pointer">Ver todas</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer transition-colors"
                    >
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{notif.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-mono font-bold text-slate-600 tracking-wider uppercase">
            {adminProfile?.role || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};
