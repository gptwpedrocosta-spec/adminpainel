import React, { useState } from 'react';
import { Search, MapPin, Bike, User, Calendar, XCircle, AlertCircle, Package } from 'lucide-react';
import { Ride } from '../types';
import { PageContainer } from '../components/PageContainer';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { usePermissions } from '../hooks/usePermissions';
import { updateRideStatus } from '../services/dbService';

interface RidesProps {
  rides: Ride[];
}

export const Rides: React.FC<RidesProps> = ({ rides }) => {
  const { hasAccess } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'accepted' | 'in_progress' | 'finished' | 'canceled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ride' | 'delivery'>('all');

  // Filter rides and deliveries
  const filteredRides = rides.filter((ride) => {
    const matchesSearch = 
      ride.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.driverName && ride.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ride.originAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.id.includes(searchTerm);

    const matchesStatus = 
      statusFilter === 'all' || 
      ride.status === statusFilter;

    const matchesType = 
      typeFilter === 'all' || 
      ride.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCancelRide = async (rideId: string) => {
    if (confirm("Deseja realmente cancelar esta corrida manualmente?")) {
      try {
        await updateRideStatus(rideId, 'canceled');
      } catch (err) {
        alert("Erro ao cancelar corrida: " + err);
      }
    }
  };

  const handleStatusProgress = async (rideId: string, currentStatus: Ride['status']) => {
    let nextStatus: Ride['status'] | null = null;
    if (currentStatus === 'waiting') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'finished';

    if (nextStatus) {
      try {
        await updateRideStatus(rideId, nextStatus);
      } catch (err) {
        alert("Erro ao avançar status: " + err);
      }
    }
  };

  return (
    <PageContainer 
      title="Monitoramento de Corridas" 
      subtitle="Supervisão de chamados em andamento, rotas ativas e alteração manual de fluxo de corridas"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar ID, passageiro, piloto ou endereço..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            {/* Type Selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-hidden focus:border-amber-400"
            >
              <option value="all">Todos os tipos</option>
              <option value="ride">Viagens (Carona)</option>
              <option value="delivery">Entregas (Pacotes)</option>
            </select>

            {/* Status selector buttons */}
            <div className="flex gap-1 bg-slate-50 border border-slate-150 p-1 rounded-xl overflow-x-auto">
              {(['all', 'waiting', 'accepted', 'in_progress', 'finished', 'canceled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap capitalize transition-all ${
                    statusFilter === status 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  {status === 'all' ? 'Tudo' :
                   status === 'waiting' ? 'Aguardando' :
                   status === 'accepted' ? 'Aceita' :
                   status === 'in_progress' ? 'Em curso' :
                   status === 'finished' ? 'Concluída' : 'Cancelada'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rides Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRides.length === 0 ? (
            <div className="p-16 text-center text-slate-400 border border-slate-150 border-dashed rounded-2xl bg-white col-span-full">
              <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Nenhuma corrida / entrega correspondente encontrada.</p>
              <p className="text-[10px] font-mono mt-1">Acione o criador de chamados rápidos na barra de cabeçalho superior.</p>
            </div>
          ) : (
            filteredRides.map((ride) => {
              const isDelivery = ride.type === 'delivery';
              const isActive = ['waiting', 'accepted', 'in_progress'].includes(ride.status);

              return (
                <div 
                  key={ride.id} 
                  className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header card */}
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">ID: #{ride.id.slice(-6)}</span>
                      <span className="text-xs font-bold text-slate-700 capitalize flex items-center gap-1 mt-0.5">
                        {isDelivery ? <Package size={12} className="text-amber-500" /> : <Bike size={12} className="text-amber-500" />}
                        {isDelivery ? 'Serviço de Entrega' : 'Viagem de Passageiro'}
                      </span>
                    </div>
                    
                    <StatusBadge status={ride.status} />
                  </div>

                  {/* Body details */}
                  <div className="p-4 space-y-4 flex-1">
                    {/* Addresses */}
                    <div className="space-y-3 relative pl-4 border-l-2 border-slate-100">
                      {/* Origin Dot */}
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="text-xs leading-normal">
                        <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Origem</span>
                        <span className="text-slate-700 font-semibold block truncate">{ride.originAddress}</span>
                      </div>

                      {/* Dest Dot */}
                      <div className="absolute left-[-5px] bottom-1.5 w-2 h-2 rounded-full bg-amber-500" />
                      <div className="text-xs leading-normal">
                        <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Destino</span>
                        <span className="text-slate-700 font-semibold block truncate">{ride.destAddress}</span>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-500">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Cliente</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <User size={12} className="text-slate-400" />
                          <span className="truncate font-bold text-slate-800">{ride.userName}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Motorista</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Bike size={12} className="text-slate-400" />
                          <span className="truncate font-bold text-slate-800">
                            {ride.driverName || 'Buscando piloto...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs font-bold">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Distância</span>
                        <span className="font-mono font-bold text-slate-800 block mt-0.5">{ride.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Estimativa</span>
                        <span className="font-mono font-bold text-slate-800 block mt-0.5">{ride.duration} min</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Tarifa</span>
                        <span className="font-mono font-bold text-emerald-600 block mt-0.5">R$ {ride.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer and interactions */}
                  <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex gap-2">
                    {isActive ? (
                      <>
                        <button
                          onClick={() => handleCancelRide(ride.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <XCircle size={13} />
                          <span>Cancelar</span>
                        </button>

                        <button
                          onClick={() => handleStatusProgress(ride.id, ride.status)}
                          className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          {ride.status === 'waiting' ? 'Vincular Piloto' :
                           ride.status === 'accepted' ? 'Iniciar Corrida' : 'Concluir Corrida'}
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase font-bold justify-center py-1">
                        <Calendar size={12} />
                        <span>Sincronizado: {new Date(ride.updatedAt || ride.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
};
