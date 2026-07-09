import React, { useState } from 'react';
import { Search, Package, Phone, User, MapPin, Truck, AlertCircle } from 'lucide-react';
import { DeliveryDetails, Ride } from '../types';
import { PageContainer } from '../components/PageContainer';
import { StatusBadge } from '../components/StatusBadge';

interface DeliveriesProps {
  deliveries: DeliveryDetails[];
  rides: Ride[];
}

export const Deliveries: React.FC<DeliveriesProps> = ({ deliveries, rides }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Assemble full deliveries details by matching the corresponding ride
  const assembledDeliveries = deliveries.map((delivery) => {
    const associatedRide = rides.find((r) => r.id === delivery.rideId);
    return {
      ...delivery,
      ride: associatedRide
    };
  });

  const filteredDeliveries = assembledDeliveries.filter((del) => {
    return (
      del.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (del.ride?.driverName && del.ride.driverName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <PageContainer 
      title="Monitoramento de Entregas" 
      subtitle="Ficha de controle de remessas e pacotes, rotas de entrega e progresso de despacho de mercadorias"
    >
      <div className="space-y-6">
        {/* Search Header */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar remetente, destinatário, pacote..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">Total: {filteredDeliveries.length} Entregas Cadastradas</span>
        </div>

        {/* Grid of Delivery cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDeliveries.length === 0 ? (
            <div className="p-16 text-center text-slate-400 border border-slate-150 border-dashed rounded-2xl bg-white col-span-full">
              <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Nenhuma remessa em transporte ativa.</p>
              <p className="text-[10px] font-mono mt-1">Insira um chamado do tipo "Entrega" no painel superior de atalhos rápidos.</p>
            </div>
          ) : (
            filteredDeliveries.map((del) => {
              const progress = 
                del.status === 'waiting' ? 10 :
                del.status === 'accepted' ? 40 :
                del.status === 'in_progress' ? 70 :
                del.status === 'finished' ? 100 : 0;

              return (
                <div 
                  key={del.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header card with status and icon */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shrink-0">
                          <Package size={20} />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase leading-none">Rastreio Logístico</span>
                          <h4 className="font-display font-bold text-slate-800 text-sm mt-1">ID Remessa: #{del.id.slice(-6)}</h4>
                        </div>
                      </div>
                      
                      <StatusBadge status={del.status} />
                    </div>

                    {/* Progress bar */}
                    {del.status !== 'canceled' && (
                      <div className="mb-5">
                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                          <span>Acompanhamento</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                          <span className={del.status === 'waiting' ? 'text-amber-500' : ''}>1. Coleta</span>
                          <span className={del.status === 'accepted' ? 'text-blue-500' : ''}>2. Atribuído</span>
                          <span className={del.status === 'in_progress' ? 'text-purple-500' : ''}>3. Trânsito</span>
                          <span className={del.status === 'finished' ? 'text-emerald-500' : ''}>4. Entregue</span>
                        </div>
                      </div>
                    )}

                    {/* Sender vs Receiver card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl text-xs font-semibold text-slate-600">
                      {/* Sender */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Remetente (Coleta)</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span>{del.senderName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 leading-relaxed">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={del.ride?.originAddress}>{del.ride?.originAddress || 'Endereço Indisponível'}</span>
                        </div>
                      </div>

                      {/* Receiver */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Destinatário (Entrega)</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span>{del.receiverName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 leading-relaxed">
                          <Phone size={10} className="text-slate-400 shrink-0" />
                          <span>{del.receiverPhone}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 leading-relaxed">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={del.ride?.destAddress}>{del.ride?.destAddress || 'Endereço Indisponível'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package details */}
                  <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase leading-none">Descrição da Carga</span>
                      <p className="text-slate-700 font-bold mt-1 italic">"{del.itemDescription}"</p>
                    </div>
                    {del.ride?.driverName && (
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
                        <Truck size={14} className="text-slate-500 shrink-0" />
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 block uppercase leading-none font-bold">Portador</span>
                          <span className="text-[10px] font-bold text-slate-700">{del.ride.driverName}</span>
                        </div>
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
