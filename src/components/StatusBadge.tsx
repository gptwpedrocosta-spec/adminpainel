import React from 'react';

export type StatusType = 
  | 'active' | 'inactive' | 'blocked' 
  | 'pending' | 'approved' | 'rejected'
  | 'waiting' | 'accepted' | 'in_progress' | 'finished' | 'canceled';

interface StatusBadgeProps {
  status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // User / Admin statuses
      case 'active':
      case 'approved':
      case 'finished':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          label: status === 'active' ? 'Ativo' : status === 'approved' ? 'Aprovado' : 'Finalizada'
        };
      case 'inactive':
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200/60',
          label: 'Inativo'
        };
      case 'blocked':
      case 'rejected':
      case 'canceled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
          label: status === 'blocked' ? 'Bloqueado' : status === 'rejected' ? 'Rejeitado' : 'Cancelada'
        };
      
      // Ride / Delivery statuses
      case 'pending':
      case 'waiting':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
          label: status === 'pending' ? 'Pendente' : 'Aguardando'
        };
      case 'accepted':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          label: 'Aceita'
        };
      case 'in_progress':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 animate-pulse',
          label: 'Em Andamento'
        };
      
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          label: String(status)
        };
    }
  };

  const { bg, label } = getBadgeStyle();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${bg}`}>
      {label}
    </span>
  );
};
