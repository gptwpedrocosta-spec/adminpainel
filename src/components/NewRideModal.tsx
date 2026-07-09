import React, { useState } from 'react';
import { X, MapPin, DollarSign, Clock, Users, Package, HelpCircle } from 'lucide-react';
import { User, Driver, Ride } from '../types';
import { createManualRide } from '../services/dbService';

interface NewRideModalProps {
  onClose: () => void;
  users: User[];
  drivers: Driver[];
}

export const NewRideModal: React.FC<NewRideModalProps> = ({ onClose, users, drivers }) => {
  const [type, setType] = useState<'ride' | 'delivery'>('ride');
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || 'usr_1');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || 'drv_1');
  const [origin, setOrigin] = useState('Av. Paulista, 1000 - Bela Vista, São Paulo - SP');
  const [destination, setDestination] = useState('Rua Augusta, 1500 - Consolação, São Paulo - SP');
  const [price, setPrice] = useState(15.50);
  const [distance, setDistance] = useState(2.8);
  const [duration, setDuration] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefilled address options to make it super fast for the admin
  const addressPresets = [
    { name: 'Paulista para Augusta', origin: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', dest: 'Rua Augusta, 1500 - Consolação, São Paulo - SP', dist: 2.1, price: 12.50, dur: 8 },
    { name: 'Itaim Bibi para Pinheiros', origin: 'Rua Tabapuã, 500 - Itaim Bibi, São Paulo - SP', dest: 'Av. Rebouças, 3970 - Pinheiros, São Paulo - SP', dist: 3.8, price: 18.20, dur: 12 },
    { name: 'Vila Mariana para Ibirapuera', origin: 'Av. Brig. Luís Antônio, 2200 - Bela Vista, São Paulo - SP', dest: 'Parque do Ibirapuera, Portão 3 - SP', dist: 4.5, price: 22.00, dur: 15 },
    { name: 'Consolação para Santa Cruz', origin: 'Rua da Consolação, 2300 - Cerqueira César, São Paulo - SP', dest: 'Metrô Santa Cruz - Vila Mariana, São Paulo - SP', dist: 6.7, price: 28.50, dur: 18 }
  ];

  const handleSelectPreset = (preset: typeof addressPresets[0]) => {
    setOrigin(preset.origin);
    setDestination(preset.dest);
    setDistance(preset.dist);
    setPrice(preset.price);
    setDuration(preset.dur);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const user = users.find(u => u.id === selectedUserId) || { name: 'Cliente Anônimo', phone: '(11) 99999-9999' };
    const driver = drivers.find(d => d.id === selectedDriverId);

    // Lat/lng coordinates estimation based on SP preset index or random values near SP center
    const randomLatLngNearSP = () => {
      const lat = -23.55052 + (Math.random() - 0.5) * 0.05;
      const lng = -46.633308 + (Math.random() - 0.5) * 0.05;
      return { lat, lng };
    };

    const rideData: Partial<Ride> = {
      userId: selectedUserId,
      userName: user.name,
      userPhone: user.phone,
      driverId: driver?.id,
      driverName: driver?.name,
      driverPhone: driver?.phone,
      originAddress: origin,
      destAddress: destination,
      originLatLng: randomLatLngNearSP(),
      destLatLng: randomLatLngNearSP(),
      distance,
      duration,
      price,
      fee: price * 0.2, // 20% commission
      status: 'waiting',
      type,
    };

    try {
      await createManualRide(rideData);
      onClose();
    } catch (err) {
      alert("Erro ao criar corrida simulada: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-white border border-slate-150 rounded-2xl max-w-xl w-full shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">Painel Simulador</span>
            <h3 className="font-display font-bold text-slate-800 text-base">Agendar / Criar Corrida Manual</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Preset selections */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-2">Predefinições de Rotas (São Paulo)</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {addressPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-[10px] font-semibold text-slate-600 whitespace-nowrap transition-all shadow-2xs shrink-0"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate}>
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Type selector */}
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Tipo de Transporte</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('ride')}
                  className={`py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === 'ride' 
                      ? 'border-amber-400 bg-amber-50/20 text-slate-800' 
                      : 'border-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Users size={14} />
                  <span>Viagem com Passageiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('delivery')}
                  className={`py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === 'delivery' 
                      ? 'border-amber-400 bg-amber-50/20 text-slate-800' 
                      : 'border-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Package size={14} />
                  <span>Entrega de Mercadoria</span>
                </button>
              </div>
            </div>

            {/* Customer & Driver Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Cliente Solicitante</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                  {users.length === 0 && (
                    <option value="usr_1">Ana Beatriz Souza (Default)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Motorista Designado</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400"
                >
                  <option value="">Nenhum (Aguardando na fila)</option>
                  {drivers.filter(d => d.status === 'approved').map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.vehicle.model})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Addresses inputs */}
            <div className="space-y-3 relative pl-4 border-l-2 border-slate-100">
              <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Local de Partida (Endereço Completo)</label>
                <input 
                  type="text" 
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="absolute left-[-5px] bottom-1.5 w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">Local de Destino (Endereço Completo)</label>
                <input 
                  type="text" 
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            {/* Calculated Values */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Distância (KM)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 font-bold">KM</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Duração (Min)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 font-bold">MIN</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Valor do Serviço</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? 'Agendando...' : 'Simular Corrida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
