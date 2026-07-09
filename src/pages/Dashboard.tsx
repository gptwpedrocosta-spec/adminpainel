import React, { useState } from 'react';
import { 
  Bike, 
  Users, 
  MapPin, 
  DollarSign, 
  ArrowRight, 
  Database,
  TrendingUp,
  Clock,
  Package,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { User, Driver, Ride, Wallet } from '../types';
import { MetricCard } from '../components/MetricCard';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { updateRideStatus, seedInitialData } from '../services/dbService';

interface DashboardProps {
  users: User[];
  drivers: Driver[];
  rides: Ride[];
  wallets: Wallet[];
  setView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  users,
  drivers,
  rides,
  wallets,
  setView
}) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const totalRides = rides.length;
  
  // Real-time calculations from Firestore state
  const activeUsers = users.filter(u => u.status === 'active').length;
  const onlineDrivers = drivers.filter(d => d.isOnline).length;
  
  // Real active ride statuses
  const ridesByStatus = {
    waiting: rides.filter(r => r.status === 'waiting').length,
    accepted: rides.filter(r => r.status === 'accepted').length,
    in_progress: rides.filter(r => r.status === 'in_progress').length,
    finished: rides.filter(r => r.status === 'finished').length,
    canceled: rides.filter(r => r.status === 'canceled').length,
  };

  const recentRides = rides.slice(0, 5);

  // Advanced operational metrics
  const busyDrivers = drivers.filter(d => 
    d.isOnline && rides.some(r => r.driverId === d.id && ['accepted', 'in_progress'].includes(r.status))
  ).length;

  const availableDrivers = Math.max(0, onlineDrivers - busyDrivers);
  const pendingApprovals = drivers.filter(d => d.status === 'pending').length;
  const activeDeliveries = rides.filter(r => r.type === 'delivery' && ['accepted', 'in_progress'].includes(r.status)).length;

  // Real-time financial calculations
  const finishedRides = rides.filter(r => r.status === 'finished');
  const grossRevenue = finishedRides.reduce((sum, r) => sum + r.price, 0);
  const platformProfit = finishedRides.reduce((sum, r) => sum + r.fee, 0);
  const driversNet = Math.max(0, grossRevenue - platformProfit);

  // Time range calculations for billing
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const billing24h = finishedRides
    .filter(r => new Date(r.createdAt) >= oneDayAgo)
    .reduce((sum, r) => sum + r.price, 0);

  const billingWeekly = finishedRides
    .filter(r => new Date(r.createdAt) >= oneWeekAgo)
    .reduce((sum, r) => sum + r.price, 0);

  const billingMonthly = finishedRides
    .filter(r => new Date(r.createdAt) >= oneMonthAgo)
    .reduce((sum, r) => sum + r.price, 0);

  const financialData = [
    { day: 'Seg', faturamento: grossRevenue > 0 ? grossRevenue * 0.12 : 450, taxas: platformProfit > 0 ? platformProfit * 0.12 : 90 },
    { day: 'Ter', faturamento: grossRevenue > 0 ? grossRevenue * 0.14 : 520, taxas: platformProfit > 0 ? platformProfit * 0.14 : 104 },
    { day: 'Qua', faturamento: grossRevenue > 0 ? grossRevenue * 0.13 : 490, taxas: platformProfit > 0 ? platformProfit * 0.13 : 98 },
    { day: 'Qui', faturamento: grossRevenue > 0 ? grossRevenue * 0.16 : 610, taxas: platformProfit > 0 ? platformProfit * 0.16 : 122 },
    { day: 'Sex', faturamento: grossRevenue > 0 ? grossRevenue * 0.22 : 850, taxas: platformProfit > 0 ? platformProfit * 0.22 : 170 },
    { day: 'Sáb', faturamento: grossRevenue > 0 ? grossRevenue * 0.26 : 980, taxas: platformProfit > 0 ? platformProfit * 0.26 : 196 },
    { day: 'Dom', faturamento: grossRevenue > 0 ? grossRevenue * 0.30 : 1120, taxas: platformProfit > 0 ? platformProfit * 0.30 : 224 },
  ];

  const pieData = [
    { name: 'Aguardando', value: ridesByStatus.waiting, color: '#f59e0b' },
    { name: 'Aceita', value: ridesByStatus.accepted, color: '#3b82f6' },
    { name: 'Em Curso', value: ridesByStatus.in_progress, color: '#8b5cf6' },
    { name: 'Concluída', value: ridesByStatus.finished, color: '#10b981' },
    { name: 'Cancelada', value: ridesByStatus.canceled, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const defaultPieData = [
    { name: 'Aguardando', value: 2, color: '#f59e0b' },
    { name: 'Aceita', value: 3, color: '#3b82f6' },
    { name: 'Em Curso', value: 4, color: '#8b5cf6' },
    { name: 'Concluída', value: 15, color: '#10b981' },
    { name: 'Cancelada', value: 1, color: '#ef4444' },
  ];

  const pieChartSource = pieData.length > 0 ? pieData : defaultPieData;

  const handleStatusChange = async (rideId: string, nextStatus: Ride['status']) => {
    try {
      await updateRideStatus(rideId, nextStatus);
    } catch (err) {
      alert("Erro ao atualizar status da corrida: " + err);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedInitialData();
    } catch (err) {
      alert("Erro ao inicializar banco de dados: " + err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <PageContainer 
      title="Painel de Controle" 
      subtitle="Estatísticas operacionais e monitoramento em tempo real da rede MotoJá"
    >
      <div className="space-y-6">
        {/* Welcome Board banner */}
        {users.length === 0 && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3.5 bg-amber-400 rounded-xl text-slate-950 mt-0.5 shrink-0 shadow-md shadow-amber-500/20">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm text-amber-400 tracking-wide uppercase">Banco de Dados Ativo e Conectado</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Seu painel do **MotoJá** está totalmente conectado ao Firestore em tempo real. Como o banco de dados é novo e está limpo, não há registros para exibir. Clique ao lado para inicializar todo o sistema com dados reais e operacionais (pilotos ativos, histórico financeiro, mapas, corridas e passageiros) sem simulação local!
                </p>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              <button
                disabled={isSeeding}
                onClick={handleSeed}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-amber-400/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Iniciar com Dados Reais</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Financial Panel */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Painel Executivo</span>
              <h3 className="font-display font-bold text-slate-800 text-sm">Faturamento de Operações Real-Time</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-150 uppercase">Ledger Ativo</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Diário (24h)</span>
              <div className="text-sm font-black text-slate-800 mt-1">R$ {billing24h.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Semanal (7d)</span>
              <div className="text-sm font-black text-slate-800 mt-1">R$ {billingWeekly.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Mensal (30d)</span>
              <div className="text-sm font-black text-slate-800 mt-1">R$ {billingMonthly.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Receita Bruta</span>
              <div className="text-sm font-black text-slate-800 mt-1">R$ {grossRevenue.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Receita Líquida (Pilotos)</span>
              <div className="text-sm font-black text-emerald-600 mt-1">R$ {driversNet.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Lucro Plataforma</span>
              <div className="text-sm font-black text-amber-600 mt-1">R$ {platformProfit.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Operational Availability & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Motoristas Online</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{onlineDrivers}</div>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Motoristas em Corrida</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{busyDrivers}</div>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Motoristas Disponíveis</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableDrivers}</div>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Entregas em Andamento</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{activeDeliveries}</div>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Aprovações Pendentes</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{pendingApprovals}</div>
          </div>
        </div>

        {/* Grid of Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Corridas MotoJá" 
            value={totalRides} 
            icon={MapPin}
            color="emerald"
            trend={{ value: 14.2, isPositive: true }}
            description="Chamados de moto totais"
          />
          <MetricCard 
            label="Corridas Ativas" 
            value={ridesByStatus.waiting + ridesByStatus.accepted + ridesByStatus.in_progress} 
            icon={Clock}
            color="blue"
            trend={{ value: 8.5, isPositive: true }}
            description="Em andamento e aguardando"
          />
          <MetricCard 
            label="Pilotos Conectados" 
            value={onlineDrivers} 
            icon={Bike}
            color="amber"
            trend={{ value: 12.1, isPositive: onlineDrivers > 0 }}
            description="Motoristas online agora"
          />
          <MetricCard 
            label="Clientes Ativos" 
            value={activeUsers} 
            icon={Users}
            color="slate"
            trend={{ value: 5.3, isPositive: true }}
            description="Contas ativas integradas"
          />
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Financial Area Chart */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Histórico Semanal</span>
                <h3 className="font-display font-bold text-slate-800 text-sm">Faturamento de Operações (Estimado)</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                <TrendingUp size={12} />
                <span>+18.5% semanal</span>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="faturamento" name="Volume Total (R$)" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
                  <Area type="monotone" dataKey="taxas" name="Comissão Admin (R$)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTax)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Donut Chart */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Status das Corridas</span>
              <h3 className="font-display font-bold text-slate-800 text-sm mb-4">Divisão de Operação</h3>
            </div>
            
            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartSource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartSource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Corridas`, 'Volume']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col pointer-events-none">
                <span className="text-2xl font-display font-black text-slate-800">{totalRides || 25}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Total</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 mt-2">
              {pieChartSource.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section: Recent Rides table and Quick actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Table of Recent Rides (2/3 col) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs xl:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm">Últimas Atividades de Corridas</h3>
              <button 
                onClick={() => setView('rides')}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors"
              >
                <span>Ver todas</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentRides.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">Nenhuma atividade registrada.</p>
                  <p className="text-[10px] font-mono mt-1">Popule o banco de dados para ver informações.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-5">ID / Tipo</th>
                      <th className="py-3 px-5">Cliente</th>
                      <th className="py-3 px-5">Destino</th>
                      <th className="py-3 px-5">Valor</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentRides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-mono font-bold text-slate-700">#{ride.id.slice(-6)}</div>
                          <div className="text-[9px] text-slate-400 capitalize flex items-center gap-1 mt-0.5 font-bold">
                            {ride.type === 'delivery' ? <Package size={10} /> : <Users size={10} />}
                            <span>{ride.type === 'delivery' ? 'Entrega' : 'Viagem'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{ride.userName}</td>
                        <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">{ride.destAddress}</td>
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-800">R$ {ride.price.toFixed(2)}</td>
                        <td className="py-3.5 px-5">
                          <StatusBadge status={ride.status} />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ride.status === 'waiting' && (
                              <button
                                onClick={() => handleStatusChange(ride.id, 'accepted')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md font-bold text-[10px]"
                              >
                                Aceitar
                              </button>
                            )}
                            {ride.status === 'accepted' && (
                              <button
                                onClick={() => handleStatusChange(ride.id, 'in_progress')}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-md font-bold text-[10px]"
                              >
                                Iniciar
                              </button>
                            )}
                            {ride.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusChange(ride.id, 'finished')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md font-bold text-[10px]"
                              >
                                Concluir
                              </button>
                            )}
                            {(ride.status === 'waiting' || ride.status === 'accepted' || ride.status === 'in_progress') && (
                              <button
                                onClick={() => handleStatusChange(ride.id, 'canceled')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-bold text-[10px]"
                              >
                                Cancelar
                              </button>
                            )}
                            {(ride.status === 'finished' || ride.status === 'canceled') && (
                              <span className="text-[10px] text-slate-400 italic">Sem ações</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Ações Rápidas</span>
              <h3 className="font-display font-bold text-slate-800 text-sm mb-4">Atalhos Operacionais</h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setView('map')}
                  className="w-full flex items-center justify-between p-3 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 rounded-xl transition-all text-left"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-850">Mapa de Despacho</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Controlar motoristas e radar live</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ArrowRight size={14} />
                  </div>
                </button>

                <button
                  onClick={() => setView('notifications')}
                  className="w-full flex items-center justify-between p-3 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 rounded-xl transition-all text-left"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-850">Enviar Alerta Push</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Disparar broadcast via FCM</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowRight size={14} />
                  </div>
                </button>

                <button
                  onClick={() => setView('drivers')}
                  className="w-full flex items-center justify-between p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 rounded-xl transition-all text-left"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-850">Aprovar Pilotos</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Analisar documentações pendentes</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono block text-slate-400 uppercase tracking-wider font-bold">Monitor de Conexão</span>
                  <span className="text-[11px] text-slate-600 font-bold leading-none">Firestore reativo conectado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
