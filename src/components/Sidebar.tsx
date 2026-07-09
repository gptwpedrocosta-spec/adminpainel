import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Bike, 
  MapPin, 
  Package, 
  DollarSign, 
  Bell, 
  Settings,
  LogOut,
  X,
  Lock,
  UserPlus,
  ShieldAlert,
  FileText,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { AppFeature } from '../utils/permissions';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isOpen, 
  setIsOpen
}) => {
  const { adminProfile, logout } = useAuth();
  const { role, hasAccess } = usePermissions();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' as AppFeature },
    { id: 'registrations', name: 'Gestão de Contas', icon: UserPlus, feature: 'registrations' as AppFeature },
    { id: 'users', name: 'Usuários', icon: Users, feature: 'users' as AppFeature },
    { id: 'drivers', name: 'Motoristas', icon: Bike, feature: 'drivers' as AppFeature },
    { id: 'rides', name: 'Corridas', icon: MapPin, feature: 'rides' as AppFeature },
    { id: 'deliveries', name: 'Entregas', icon: Package, feature: 'deliveries' as AppFeature },
    { id: 'financial', name: 'Financeiro', icon: DollarSign, feature: 'financial' as AppFeature },
    { id: 'map', name: 'Mapa ao Vivo', icon: MapPin, feature: 'map' as AppFeature, badge: 'LIVE' },
    { id: 'security', name: 'Segurança & Pânico', icon: ShieldAlert, feature: 'security' as AppFeature },
    { id: 'audit_logs', name: 'Auditoria & Logs', icon: FileText, feature: 'audit_logs' as AppFeature },
    { id: 'backup_security', name: 'Backup & Segurança', icon: Database, feature: 'backup_security' as AppFeature },
    { id: 'notifications', name: 'Notificações', icon: Bell, feature: 'notifications' as AppFeature },
    { id: 'settings', name: 'Configurações', icon: Settings, feature: 'settings' as AppFeature },
  ];

  const handleNavClick = (viewId: string, feature: AppFeature) => {
    if (!hasAccess(feature)) return;
    setView(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out border-r border-slate-900
        lg:translate-x-0 lg:static lg:h-screen shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Upper part */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo / Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-display font-bold text-slate-950 text-lg shadow-md shadow-amber-500/20">
                M
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  MotoJá
                </span>
                <span className="text-[10px] font-mono block text-slate-500 -mt-1 font-bold">PAINEL DE CONTROLE</span>
              </div>
            </div>
            <button 
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-900"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Current Admin Quick Info */}
          <div className="px-6 py-4 border-b border-slate-900/50 bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700 font-display font-semibold select-none">
                {adminProfile?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-semibold text-slate-200 truncate">{adminProfile?.name || 'Administrador'}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${adminProfile?.role === 'super_admin' ? 'bg-amber-400' : adminProfile?.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="text-[10px] text-slate-400 capitalize font-mono font-bold">{adminProfile?.role || 'Acesso'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isAllowed = hasAccess(item.feature);

              return (
                <button
                  key={item.id}
                  disabled={!isAllowed}
                  onClick={() => handleNavClick(item.id, item.feature)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                    ${!isAllowed 
                      ? 'opacity-40 cursor-not-allowed text-slate-600 hover:bg-transparent' 
                      : isActive 
                        ? 'bg-amber-400 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isAllowed && <Lock size={12} className="text-slate-600" />}
                    {item.badge && isAllowed && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-xs ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower part */}
        <div className="p-4 border-t border-slate-900 space-y-2 shrink-0">
          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all"
          >
            <LogOut size={16} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
