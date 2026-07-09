import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Scale, Ban, Trash2, Check, X, ShieldAlert, Phone, MapPin, User, FileText, CheckCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToSecurityEvents, 
  resolveSecurityEvent, 
  triggerSecurityEvent,
  subscribeToDisputes, 
  updateDisputeStatus, 
  subscribeToBlacklist, 
  addToBlacklist, 
  removeFromBlacklist,
  logAdminAction
} from '../services/dbService';

export const Security: React.FC = () => {
  const { hasAccess } = usePermissions();
  const { admin } = useAuth();

  const [activeTab, setActiveTab] = useState<'alarms' | 'disputes' | 'blacklist'>('alarms');
  
  // Real-time states
  const [alarms, setAlarms] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio configuration
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Blacklist form
  const [blValue, setBlValue] = useState('');
  const [blType, setBlType] = useState<'cpf' | 'phone' | 'email'>('cpf');
  const [blReason, setBlReason] = useState('');

  // Dispute resolution modal/state
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Subscriptions
  useEffect(() => {
    const unsubAlarms = subscribeToSecurityEvents((data) => setAlarms(data));
    const unsubDisputes = subscribeToDisputes((data) => setDisputes(data));
    const unsubBlacklist = subscribeToBlacklist((data) => setBlacklist(data));

    return () => {
      unsubAlarms();
      unsubDisputes();
      unsubBlacklist();
    };
  }, []);

  // Panic sound alert trigger
  useEffect(() => {
    const hasActiveAlarms = alarms.some(a => a.status === 'active');
    if (hasActiveAlarms && soundEnabled) {
      // Start repetitive beeping using standard Web Audio API
      let ctx = audioCtx;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
      }

      const interval = setInterval(() => {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
        if (ctx) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 high pitch beep
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [alarms, soundEnabled, audioCtx]);

  const handleResolveAlarm = async (alarmId: string) => {
    if (!hasAccess('security')) {
      alert("Seu perfil não possui permissão para resolver ocorrências.");
      return;
    }
    try {
      await resolveSecurityEvent(alarmId);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `Encerrou e resolveu chamado de pânico de ID #${alarmId.slice(-6)}`);
      alert("Ocorrência marcada como RESOLVIDA com sucesso!");
    } catch (err) {
      alert("Erro ao resolver ocorrência: " + err);
    }
  };

  const handleTriggerMockAlarm = async () => {
    // Allows admin to simulate a panic event on-demand to prove real-time siren logs
    const mockId = `panic_${Date.now()}`;
    try {
      await triggerSecurityEvent({
        id: mockId,
        reporterName: "Marcos Pinheiro (Condutor)",
        reporterPhone: "(11) 94812-3211",
        reporterRole: "driver",
        rideId: "ride_1",
        latitude: -23.55052,
        longitude: -46.633308,
        description: "Botão de Pânico acionado pelo console do piloto. Desvio de rota suspeito detectado na Av. Paulista."
      });
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `Simulou acionamento de pânico: marcos_pinheiro (drv_1)`);
    } catch (err) {
      alert("Erro ao simular pânico: " + err);
    }
  };

  const handleDisputeAction = async (status: 'resolved' | 'rejected') => {
    if (!selectedDispute) return;
    if (!resolutionNotes.trim()) {
      alert("Por favor, digite as notas de resolução para o histórico corporativo.");
      return;
    }

    setLoading(true);
    try {
      await updateDisputeStatus(selectedDispute.id, status, resolutionNotes);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(
        actingAdminName, 
        `${status === 'resolved' ? 'APROVOU' : 'REJEITOU'} disputa de faturamento do chamado #${selectedDispute.rideId.slice(-6)}. Notas: ${resolutionNotes}`
      );
      setSelectedDispute(null);
      setResolutionNotes('');
      alert(`Disputa finalizada como: ${status.toUpperCase()}`);
    } catch (err) {
      alert("Erro ao salvar resolução da disputa: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!blValue.trim() || !blReason.trim()) {
      setErrorMsg("Preencha todos os campos do formulário de banimento.");
      return;
    }

    setLoading(true);
    try {
      await addToBlacklist({
        value: blValue.trim(),
        type: blType,
        reason: blReason.trim()
      });

      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `Adicionou credencial à Lista Negra: ${blValue} (${blType.toUpperCase()})`);

      setSuccessMsg(`Credencial '${blValue}' banida com sucesso das operações MotoJá!`);
      setBlValue('');
      setBlReason('');
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao adicionar à Lista Negra.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlacklist = async (id: string, value: string) => {
    if (!hasAccess('security')) {
      alert("Sem permissão para remover restrições.");
      return;
    }

    if (!window.confirm(`Deseja revogar o banimento da credencial ${value}?`)) return;

    try {
      await removeFromBlacklist(id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `Revogou restrição e removeu da Lista Negra: ${value}`);
      alert("Restrição revogada com sucesso!");
    } catch (err) {
      alert("Erro ao revogar: " + err);
    }
  };

  const activeAlarms = alarms.filter(a => a.status === 'active');

  return (
    <PageContainer
      title="Central de Segurança Corporativa"
      subtitle="Monitoramento de alarmes de pânico, centralização de auditoria de fraudes, disputas e lista negra em tempo real"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white p-1 border border-slate-150 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-1">
          <button
            onClick={() => setActiveTab('alarms')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'alarms' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={15} className={activeAlarms.length > 0 ? 'text-red-500 animate-pulse' : ''} />
            <span>Central de Emergência</span>
            {activeAlarms.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'disputes' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Scale size={15} />
            <span>Disputas & Reembolsos</span>
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'blacklist' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Ban size={15} />
            <span>Lista Negra (Antifraude)</span>
          </button>
        </div>

        {/* Tab: Central de Emergência */}
        {activeTab === 'alarms' && (
          <div className="space-y-6">
            {/* Alarm banner indicator */}
            {activeAlarms.length > 0 ? (
              <div className="p-5 bg-red-600 text-white rounded-2xl shadow-lg border border-red-700 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden animate-pulse">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-white text-red-600 rounded-xl shrink-0 shadow-md">
                    <ShieldAlert size={26} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base tracking-wide uppercase">ALERTA VERMELHO: Botão de Pânico Ativo</h3>
                    <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
                      Existem <strong>{activeAlarms.length}</strong> chamados de socorro em aberto no momento! Os canais de áudio e localização de coordenadas estão atualizando em tempo real no banco do Firestore. Efetue as tratativas imediatas com as autoridades de segurança local.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 relative z-10">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 bg-red-700 hover:bg-red-800 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    {soundEnabled ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{soundEnabled ? "Mudar p/ Silencioso" : "Ativar Sirene"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>Todos os canais operacionais seguros. Sem pânicos ou alertas de perigo em SP.</span>
                </div>
                <button
                  onClick={handleTriggerMockAlarm}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase font-mono rounded-lg transition-all cursor-pointer"
                >
                  Simular Pânico Piloto
                </button>
              </div>
            )}

            {/* List of Panic Alarms */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-800 text-sm">Registro de Acionamentos de Emergência</h3>
              </div>
              
              <div className="divide-y divide-slate-100">
                {alarms.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <p className="text-xs font-semibold">Nenhuma ocorrência registrada no histórico de segurança.</p>
                    <p className="text-[10px] font-mono mt-1">Acione o botão "Simular Pânico" para ver o acionamento em tempo real.</p>
                  </div>
                ) : (
                  alarms.map((alarm) => (
                    <div 
                      key={alarm.id} 
                      className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                        alarm.status === 'active' ? 'bg-red-50/20 border-l-4 border-l-red-500' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-sm ${
                            alarm.reporterRole === 'driver' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {alarm.reporterRole === 'driver' ? 'MOTORISTA' : 'PASSAGEIRO'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">Corrida ID: #{alarm.rideId.slice(-6)}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">| {new Date(alarm.createdAt).toLocaleTimeString('pt-BR')}</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span>{alarm.reporterName}</span>
                            <span className="text-xs text-slate-400 font-normal">({alarm.reporterPhone})</span>
                          </h4>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-3xl leading-relaxed mt-1">
                            {alarm.description}
                          </p>
                        </div>

                        {/* Latitude / longitude logs */}
                        <div className="flex items-center gap-4 text-[10px] font-mono font-semibold text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-red-500" />
                            <span>Coord: {alarm.latitude.toFixed(6)}, {alarm.longitude.toFixed(6)}</span>
                          </div>
                          <a 
                            href={`https://www.google.com/maps?q=${alarm.latitude},${alarm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:underline flex items-center gap-0.5"
                          >
                            Abrir no Google Maps ↗
                          </a>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {alarm.status === 'active' ? (
                          <button
                            onClick={() => handleResolveAlarm(alarm.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-red-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Resolver Ocorrência</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200">
                            <CheckCircle size={13} className="text-emerald-500" />
                            <span>Ocorrência Resolvida</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Disputas & Reembolsos */}
        {activeTab === 'disputes' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Disputes Ledger list */}
            <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-800 text-sm">Disputas por Tarifas e Faturamentos</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">Filtro: Pendentes</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {disputes.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <p className="text-xs font-semibold">Nenhuma disputa aberta em andamento.</p>
                    <p className="text-[10px] font-mono mt-1">As reclamações de faturamento abertas por clientes aparecem neste painel.</p>
                  </div>
                ) : (
                  disputes.map((disp) => (
                    <div 
                      key={disp.id} 
                      onClick={() => setSelectedDispute(disp)}
                      className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/40 transition-all ${
                        selectedDispute?.id === disp.id ? 'bg-amber-50/15 border-r-4 border-r-amber-400' : ''
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded-sm uppercase ${
                            disp.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            disp.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {disp.status === 'pending' ? 'PENDENTE' : disp.status === 'resolved' ? 'APROVADA/REEMBOLSADO' : 'RECUSADA'}
                          </span>
                          <span className="font-mono font-bold text-slate-400">Chamado: #{disp.rideId.slice(-6)}</span>
                        </div>

                        <div className="font-semibold text-slate-700">
                          {disp.userName} <span className="text-[10px] font-mono font-normal text-slate-400">(ID: {disp.userId})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{disp.reason}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-800">R$ {disp.amount.toFixed(2)}</div>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{new Date(disp.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dispute Resolution side board */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <Scale size={15} className="text-amber-500" />
                <span className="font-display font-bold text-xs text-slate-800">Painel de Julgamento</span>
              </div>

              {selectedDispute ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-150">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Resumo da Disputa</div>
                    <div className="font-bold text-slate-800">Requerente: {selectedDispute.userName}</div>
                    <div className="font-mono text-slate-500">Valor Reclamado: R$ {selectedDispute.amount.toFixed(2)}</div>
                    <div className="text-slate-600 mt-2 leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                      "{selectedDispute.reason}"
                    </div>
                  </div>

                  {selectedDispute.status === 'pending' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Notas de Resolução (Obrigatório)</label>
                        <textarea
                          rows={3}
                          required
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Justifique a decisão regulatória para auditoria..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDisputeAction('resolved')}
                          disabled={loading}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Aprovar Estorno</span>
                        </button>
                        <button
                          onClick={() => handleDisputeAction('rejected')}
                          disabled={loading}
                          className="py-2.5 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-200 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <X size={14} />
                          <span>Rejeitar Reclamação</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Parecer do Auditor</div>
                        <div className="font-bold text-slate-800 capitalize mt-1">
                          Resultado: {selectedDispute.status === 'resolved' ? 'Estorno Deferido' : 'Reclamação Indeferida'}
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                          "{selectedDispute.resolutionNotes}"
                        </p>
                        <div className="text-[9px] font-mono text-slate-400 mt-2">
                          Finalizada em: {new Date(selectedDispute.resolvedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <FileText size={20} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold">Nenhuma disputa selecionada.</p>
                  <p className="text-[10px] font-mono mt-1">Selecione uma disputa na lista para proferir o julgamento de reembolso.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Lista Negra */}
        {activeTab === 'blacklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form list insertion */}
            <form onSubmit={handleAddBlacklist} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <Ban size={15} className="text-rose-500" />
                <span className="font-display font-bold text-xs text-slate-800">Banir Nova Credencial</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tipo de Dado</label>
                <select
                  value={blType}
                  onChange={(e: any) => setBlType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                >
                  <option value="cpf">CPF do Infrator</option>
                  <option value="phone">Telefone Celular</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Credencial / Valor</label>
                <input
                  type="text"
                  required
                  placeholder={blType === 'cpf' ? '000.000.000-00' : blType === 'phone' ? '(11) 99999-9999' : 'email@gmail.com'}
                  value={blValue}
                  onChange={(e) => setBlValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Motivo do Bloqueio</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Especifique a fraude ou comportamento abusivo detectado..."
                  value={blReason}
                  onChange={(e) => setBlReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>

              <Button
                type="submit"
                variant="danger"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Ban size={13} />}
                <span>Aplicar Restrição</span>
              </Button>
            </form>

            {/* Blacklist records ledger (2/3 col) */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-800 text-sm">Lista Negra de Credenciais Bloqueadas</h3>
              </div>

              <div className="overflow-x-auto">
                {blacklist.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <p className="text-xs font-semibold">Nenhuma restrição registrada na Lista Negra.</p>
                    <p className="text-[10px] font-mono mt-1 font-normal text-slate-300">As credenciais banidas serão mostradas aqui para consulta.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-5">Tipo</th>
                        <th className="py-3 px-5">Credencial Bloqueada</th>
                        <th className="py-3 px-5">Motivo / Causa</th>
                        <th className="py-3 px-5">Data do Ban</th>
                        <th className="py-3 px-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blacklist.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 text-[8px] font-mono font-bold rounded bg-rose-50 text-rose-700 uppercase">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-5 font-mono font-bold text-slate-700">
                            {item.value}
                          </td>
                          <td className="py-3 px-5 text-slate-500 max-w-xs truncate" title={item.reason}>
                            {item.reason}
                          </td>
                          <td className="py-3 px-5 text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button
                              onClick={() => handleRemoveBlacklist(item.id, item.value)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                              title="Remover Restrição"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
