import React, { useState } from 'react';
import { X, Bike, Mail, Phone, Lock, User, Check, RefreshCw, ClipboardList, Shield, CreditCard, Award, Eye, Play, Star } from 'lucide-react';
import { Driver, Ride, Wallet } from '../types';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { updateDriverProfileAllFields, logAdminAction } from '../services/dbService';

interface DriverEditModalProps {
  driverToEdit: Driver;
  onClose: () => void;
  onSuccess: () => void;
  rides: Ride[];
  wallets: Wallet[];
  currentAdminEmail: string;
}

export const DriverEditModal: React.FC<DriverEditModalProps> = ({
  driverToEdit,
  onClose,
  onSuccess,
  rides,
  wallets,
  currentAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'history'>('info');
  
  // Basic info states
  const [name, setName] = useState(driverToEdit.name);
  const [email, setEmail] = useState(driverToEdit.email);
  const [phone, setPhone] = useState(driverToEdit.phone || '');
  const [cpf, setCpf] = useState((driverToEdit as any).cpf || '');
  const [cnh, setCnh] = useState((driverToEdit as any).cnh || '');
  const [ear, setEar] = useState((driverToEdit as any).ear || false);
  const [address, setAddress] = useState((driverToEdit as any).address || '');
  const [birthDate, setBirthDate] = useState((driverToEdit as any).birthDate || '');
  const [newPassword, setNewPassword] = useState('');

  // Vehicle states
  const [model, setModel] = useState(driverToEdit.vehicle.model || '');
  const [brand, setBrand] = useState((driverToEdit as any).vehicle?.brand || 'Honda');
  const [year, setYear] = useState(driverToEdit.vehicle.year || '');
  const [color, setColor] = useState(driverToEdit.vehicle.color || '');
  const [plate, setPlate] = useState(driverToEdit.vehicle.licensePlate || '');
  const [renavam, setRenavam] = useState((driverToEdit as any).vehicle?.renavam || '');
  const [crlv, setCrlv] = useState((driverToEdit as any).vehicle?.crlv || '');

  // Document status states
  const [status, setStatus] = useState(driverToEdit.status);
  const [avatarUrl, setAvatarUrl] = useState(driverToEdit.avatarUrl || '');
  const [cnhPhotoUrl, setCnhPhotoUrl] = useState((driverToEdit as any).cnhPhotoUrl || '');
  const [crlvPhotoUrl, setCrlvPhotoUrl] = useState((driverToEdit as any).crlvPhotoUrl || '');
  const [rejectionReason, setRejectionReason] = useState((driverToEdit as any).rejectionReason || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stats calculation
  const driverRides = rides.filter(r => r.driverId === driverToEdit.id);
  const totalRidesCount = driverRides.length;
  const walletBalance = wallets.find(w => w.id === driverToEdit.id)?.balance || 0;
  const totalEarnings = driverRides
    .filter(r => r.status === 'completed')
    .reduce((acc, r) => acc + (r.price * 0.8), 0); // 80% payout typical
  const avgRating = (driverToEdit as any).rating || 4.9;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData: any = {
        name,
        email,
        phone,
        cpf,
        cnh,
        ear,
        address,
        birthDate,
        status,
        rejectionReason,
        vehicle: {
          model,
          brand,
          year: Number(year),
          color,
          licensePlate: plate,
          renavam,
          crlv
        },
        avatarUrl,
        cnhPhotoUrl,
        crlvPhotoUrl
      };

      if (newPassword.trim()) {
        updateData.tempPassword = newPassword.trim();
        updateData.mustChangePassword = true;
      }

      await updateDriverProfileAllFields(driverToEdit.id, updateData);

      const logDesc = `Editou piloto parceiro ${name} (${plate}). Status: ${status}.`;
      await logAdminAction(currentAdminEmail, logDesc);

      setSuccessMsg('Ficha técnica do piloto atualizada com sucesso no Firestore!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do piloto');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: 'active' | 'blocked' | 'pending' | 'rejected') => {
    setLoading(true);
    setErrorMsg('');
    try {
      await updateDriverProfileAllFields(driverToEdit.id, { 
        status: newStatus,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : ''
      });
      setStatus(newStatus);
      const logDesc = `Alterou status do piloto ${name} para: ${newStatus.toUpperCase()}`;
      await logAdminAction(currentAdminEmail, logDesc);
      setSuccessMsg(`Piloto alterado para ${newStatus.toUpperCase()} com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Bike size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Ficha Completa do Piloto</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-0.5">UID: {driverToEdit.id} | Placa: {plate}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="bg-slate-100 p-1 flex border-b border-slate-150 gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Dados Cadastrais & Moto
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'docs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Documentos & Status ({status})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Histórico & Desempenho
          </button>
        </div>

        {/* Form/Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-wider">Identificação Pessoal</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email de Contato</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Telefone Celular</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alterar Senha (Opcional)</label>
                  <input
                    type="password"
                    placeholder="Nova senha de login"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço Residencial</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                <ImageUpload
                  label="Foto de Perfil do Piloto"
                  value={avatarUrl}
                  onChange={(base64) => setAvatarUrl(base64)}
                  onClear={() => setAvatarUrl('')}
                  type="avatar"
                  id="edit-driver-avatar"
                />
              </div>

              <div className="pb-2 border-b border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-emerald-500 uppercase font-mono tracking-wider">Ficha Técnica do Veículo</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Marca / Fabr.</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Modelo / Moto</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ano Modelo</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cor</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Placa Mercosul</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">RENAVAM</label>
                  <input
                    type="text"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    placeholder="Ex: 12345678901"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código CRLV</label>
                  <input
                    type="text"
                    value={crlv}
                    onChange={(e) => setCrlv(e.target.value)}
                    placeholder="Nº de vias do CRLV"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: DOCUMENTS & STATUS APPROVAL */}
          {activeTab === 'docs' && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-500 uppercase font-mono tracking-wider">Habilitação de Documentos do Detran</span>
                <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">Condição Atual: {status.toUpperCase()}</span>
              </div>

              {/* Status Action Buttons */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap gap-2.5">
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={() => handleQuickStatusChange('active')} 
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                >
                  <Check size={14} className="mr-1" /> Aprovar e Liberar Piloto
                </Button>
                <Button 
                  type="button" 
                  variant="danger" 
                  onClick={() => handleQuickStatusChange('rejected')} 
                  disabled={loading}
                  className="shrink-0"
                >
                  <X size={14} className="mr-1" /> Rejeitar Documentação
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => handleQuickStatusChange('blocked')} 
                  disabled={loading}
                  className="shrink-0"
                >
                  <Lock size={14} className="mr-1" /> Bloquear Preventivamente
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleQuickStatusChange('pending')} 
                  disabled={loading}
                  className="shrink-0"
                >
                  <RefreshCw size={14} className="mr-1" /> Colocar em Análise (Pendente)
                </Button>
              </div>

              {status === 'rejected' && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                  <label className="text-[10px] font-bold text-rose-700 uppercase block">Motivo do Indeferimento / Rejeição</label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva detalhadamente o porquê de os documentos terem sido recusados..."
                    className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 focus:outline-hidden focus:border-rose-400"
                  />
                </div>
              )}

              {/* Document Photo Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 border border-slate-150 rounded-2xl">
                <ImageUpload
                  label="Habilitação de Trânsito (CNH)"
                  value={cnhPhotoUrl}
                  onChange={(base64) => setCnhPhotoUrl(base64)}
                  onClear={() => setCnhPhotoUrl('')}
                  type="document"
                  id="edit-driver-cnh"
                />
                <ImageUpload
                  label="Licenciamento do Veículo (CRLV)"
                  value={crlvPhotoUrl}
                  onChange={(base64) => setCrlvPhotoUrl(base64)}
                  onClear={() => setCrlvPhotoUrl('')}
                  type="document"
                  id="edit-driver-crlv"
                />
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY & EARNINGS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-purple-500 uppercase font-mono tracking-wider">Histórico de Corridas & Repasse de Ganhos</span>
              </div>

              {/* Stats bento rows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Corridas Totais</span>
                  <div className="text-xl font-extrabold text-slate-800 mt-1">{totalRidesCount}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Viagens registradas no banco</p>
                </div>

                <div className="p-4 bg-amber-50/30 border border-amber-200/40 rounded-2xl">
                  <span className="text-[9px] font-mono text-amber-600 font-bold uppercase">Repasse Líquido (80%)</span>
                  <div className="text-xl font-extrabold text-amber-700 mt-1">R$ {totalEarnings.toFixed(2)}</div>
                  <p className="text-[10px] text-amber-600 mt-0.5">Saldo total gerado por corridas</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Avaliação Média</span>
                  <div className="text-xl font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                    <span>{avgRating.toFixed(1)}</span>
                    <Star size={18} className="fill-amber-400 stroke-amber-500 mt-[-2px]" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Nota média dos passageiros</p>
                </div>
              </div>

              {/* Ride history list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Histórico de Viagens Efetuadas</span>
                {driverRides.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                    Nenhuma viagem encontrada no histórico deste piloto.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {driverRides.map((ride) => (
                      <div key={ride.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                        <div>
                          <div className="text-slate-800 font-bold truncate max-w-[280px]">{ride.destAddress}</div>
                          <span className="text-[9.5px] text-slate-400 font-mono block mt-1">
                            Preço: R$ {ride.price.toFixed(2)} | Data: {new Date(ride.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono ${
                          ride.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          ride.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {ride.status === 'completed' ? 'CONCLUÍDO' : ride.status === 'cancelled' ? 'CANCELADO' : 'EM ROTA'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fechar
          </Button>
          {activeTab === 'info' && (
            <Button variant="primary" onClick={handleUpdate} disabled={loading} className="bg-amber-400 hover:bg-amber-500 text-slate-950">
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Salvar Dados Técnico</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
