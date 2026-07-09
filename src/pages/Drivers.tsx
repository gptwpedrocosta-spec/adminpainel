import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, FileText, Bike, Mail, Phone, ExternalLink, Star, X, Trash2 } from 'lucide-react';
import { Driver, Wallet, Ride } from '../types';
import { PageContainer } from '../components/PageContainer';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { usePermissions } from '../hooks/usePermissions';
import { updateDriverStatus, toggleDriverOnline, deleteDriverAccount, logAdminAction } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';

interface DriversProps {
  drivers: Driver[];
  wallets: Wallet[];
  rides: Ride[];
}

export const Drivers: React.FC<DriversProps> = ({ drivers, wallets, rides }) => {
  const { hasAccess } = usePermissions();
  const { admin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [documentModalDriver, setDocumentModalDriver] = useState<Driver | null>(null);

  const handleDeleteDriver = async (driver: Driver) => {
    if (!hasAccess('actions.approve_driver')) {
      alert("Seu perfil de acesso não possui permissão para deletar motoristas.");
      return;
    }

    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente o motorista ${driver.name}? Esta ação apagará seus dados de perfil, histórico e carteira digital.`)) {
      return;
    }

    try {
      await deleteDriverAccount(driver.id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `EXCLUIU permanentemente o motorista: ${driver.name} (${driver.email}) e sua carteira digital.`);
      setDocumentModalDriver(null);
      alert("Motorista excluído com sucesso!");
    } catch (err) {
      alert("Erro ao excluir motorista: " + err);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (driverId: string, nextStatus: Driver['status']) => {
    if (!hasAccess('actions.approve_driver')) {
      alert("Seu perfil de acesso não possui permissão para aprovar ou alterar status de pilotos.");
      return;
    }

    try {
      await updateDriverStatus(driverId, nextStatus);
      if (documentModalDriver?.id === driverId) {
        setDocumentModalDriver({ ...documentModalDriver, status: nextStatus });
      }
    } catch (err) {
      alert("Erro ao atualizar status do motorista: " + err);
    }
  };

  const handleToggleOnline = async (driverId: string, currentOnline: boolean) => {
    try {
      await toggleDriverOnline(driverId, !currentOnline);
    } catch (err) {
      alert("Erro ao alterar estado online do motorista: " + err);
    }
  };

  return (
    <PageContainer 
      title="Gestão de Motoristas" 
      subtitle="Ficha cadastral, documentação veicular (CRLV) e controle de liberação de pilotos parceiros"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar piloto, veículo, placa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-150 rounded-xl overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Todos ({drivers.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'pending' ? 'bg-amber-50 text-amber-700 shadow-xs' : 'text-slate-400 hover:text-amber-600'
              }`}
            >
              Pendentes ({drivers.filter(d => d.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'approved' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-emerald-600'
              }`}
            >
              Aprovados ({drivers.filter(d => d.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'rejected' ? 'bg-rose-50 text-rose-700 shadow-xs' : 'text-slate-400 hover:text-rose-600'
              }`}
            >
              Recusados ({drivers.filter(d => d.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {filteredDrivers.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <p className="text-xs font-semibold">Nenhum motorista correspondente encontrado.</p>
                <p className="text-[10px] font-mono mt-1">Insira outros filtros ou use o gerador de dados demo.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">Piloto</th>
                    <th className="py-3.5 px-6">Veículo / Placa</th>
                    <th className="py-3.5 px-6">Avaliação</th>
                    <th className="py-3.5 px-6">Disponibilidade</th>
                    <th className="py-3.5 px-6">Status Cadastro</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={driver.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${driver.name}`} 
                            alt={driver.name} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{driver.name}</span>
                            <span className="text-[9px] font-mono text-slate-400">ID: {driver.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="text-slate-700 font-semibold">{driver.vehicle.model}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono font-bold uppercase">{driver.vehicle.licensePlate} ({driver.vehicle.color})</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 stroke-amber-400" />
                          <span className="font-mono font-bold text-slate-800">{driver.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <button 
                          onClick={() => handleToggleOnline(driver.id, driver.isOnline)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${
                            driver.isOnline 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${driver.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{driver.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={driver.status} />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDocumentModalDriver(driver)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors"
                            title="Analisar Documentos"
                          >
                            <FileText size={12} />
                            <span>Docs</span>
                          </button>

                          <button
                            onClick={() => handleDeleteDriver(driver)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Excluir Motorista"
                          >
                            <Trash2 size={14} />
                          </button>
                          
                          {driver.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(driver.id, 'approved')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Aprovar Cadastro"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(driver.id, 'rejected')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Recusar Cadastro"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}

                          {driver.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(driver.id, 'inactive')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100/50 rounded-md font-bold text-[10px] transition-colors"
                              title="Desativar piloto"
                            >
                              Inativar
                            </button>
                          )}

                          {driver.status === 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(driver.id, 'approved')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600 border border-emerald-100/50 rounded-md font-bold text-[10px] transition-colors"
                              title="Ativar piloto"
                            >
                              Ativar
                            </button>
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

        {/* Documents Viewer Modal */}
        {documentModalDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" 
              onClick={() => setDocumentModalDriver(null)} 
            />

            <div className="bg-white border border-slate-150 rounded-2xl max-w-2xl w-full shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider">Verificação de Piloto</span>
                  <h3 className="font-display font-bold text-slate-800 text-sm">{documentModalDriver.name}</h3>
                </div>
                <button 
                  onClick={() => setDocumentModalDriver(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Driver Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div className="space-y-2 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Bike size={14} className="text-amber-500" />
                      <span>Veículo: <strong className="text-slate-800 font-bold">{documentModalDriver.vehicle.model}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span>{documentModalDriver.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{documentModalDriver.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono block text-slate-400 uppercase font-bold">CPF</span>
                      <span className="text-slate-700 font-semibold font-mono">{(documentModalDriver as any).cpf || "234.567.890-12"}</span>
                    </div>
                  </div>
                  <div className="text-slate-600 font-medium sm:text-right flex flex-col justify-between gap-2">
                    <div>
                      <span>Status: </span>
                      <span className="font-bold ml-1 text-slate-800 uppercase font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{documentModalDriver.status}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono block text-slate-400 uppercase font-bold">Saldo do Condutor</span>
                      <span className="text-emerald-600 font-extrabold font-mono text-sm">
                        R$ {(wallets.find(w => w.id === documentModalDriver.id)?.balance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Placa: {documentModalDriver.vehicle.licensePlate} ({documentModalDriver.vehicle.color})
                    </div>
                  </div>
                </div>

                {/* Performance indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 border border-slate-150 rounded-xl bg-white text-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Viagens Feitas</span>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      {rides.filter(r => r.driverId === documentModalDriver.id && r.status === 'finished').length}
                    </div>
                  </div>
                  <div className="p-3 border border-slate-150 rounded-xl bg-white text-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Taxa Aceite</span>
                    <div className="text-base font-black text-emerald-600 mt-0.5">96%</div>
                  </div>
                  <div className="p-3 border border-slate-150 rounded-xl bg-white text-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Cancelamento</span>
                    <div className="text-base font-black text-rose-500 mt-0.5">2%</div>
                  </div>
                  <div className="p-3 border border-slate-150 rounded-xl bg-white text-center">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">EAR na CNH</span>
                    <div className="text-xs font-bold text-slate-700 bg-slate-100 py-1 px-2 rounded-md border border-slate-200 mt-1 inline-block">ATIVO / SIM</div>
                  </div>
                </div>

                {/* Documents grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Driver License CNH */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden p-3 bg-slate-50/50">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">Carteira de Habilitação (CNH)</span>
                    <div className="h-44 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative group">
                      <img 
                        src={documentModalDriver.documents.licenseUrl} 
                        alt="Carteira de Habilitação" 
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <a 
                          href={documentModalDriver.documents.licenseUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-white rounded-lg text-slate-800 text-xs font-semibold flex items-center gap-1 shadow-md"
                        >
                          <span>Ver Imagem Completa</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Document CRLV */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden p-3 bg-slate-50/50">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">Documento do Veículo (CRLV)</span>
                    <div className="h-44 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative group">
                      <img 
                        src={documentModalDriver.documents.vehicleDocUrl} 
                        alt="Documento do Veículo" 
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <a 
                          href={documentModalDriver.documents.vehicleDocUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-white rounded-lg text-slate-800 text-xs font-semibold flex items-center gap-1 shadow-md"
                        >
                          <span>Ver Imagem Completa</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteDriver(documentModalDriver)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Excluir Motorista</span>
                </button>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDocumentModalDriver(null)}
                  >
                    Voltar
                  </Button>
                {documentModalDriver.status === 'pending' ? (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleStatusChange(documentModalDriver.id, 'rejected');
                        setDocumentModalDriver(null);
                      }}
                    >
                      Recusar Cadastro
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleStatusChange(documentModalDriver.id, 'approved');
                        setDocumentModalDriver(null);
                      }}
                    >
                      Aprovar Piloto
                    </Button>
                  </>
                ) : documentModalDriver.status === 'approved' ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleStatusChange(documentModalDriver.id, 'inactive');
                      setDocumentModalDriver(null);
                    }}
                  >
                    Inativar Piloto
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleStatusChange(documentModalDriver.id, 'approved');
                      setDocumentModalDriver(null);
                    }}
                  >
                    Re-ativar Piloto
                  </Button>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
