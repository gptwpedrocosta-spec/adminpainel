import React, { useState } from 'react';
import { X, User, Mail, Phone, Lock, Check, RefreshCw, ClipboardList, CreditCard, Calendar, Star, MapPin } from 'lucide-react';
import { User as CustomerType, Ride, Wallet } from '../types';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { updateUserProfileAllFields, logAdminAction } from '../services/dbService';

interface CustomerEditModalProps {
  customerToEdit: CustomerType;
  onClose: () => void;
  onSuccess: () => void;
  rides: Ride[];
  wallets: Wallet[];
  currentAdminEmail: string;
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  customerToEdit,
  onClose,
  onSuccess,
  rides,
  wallets,
  currentAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'history'>('info');

  // Basic Info States
  const [name, setName] = useState(customerToEdit.name);
  const [email, setEmail] = useState(customerToEdit.email);
  const [phone, setPhone] = useState(customerToEdit.phone || '');
  const [cpf, setCpf] = useState((customerToEdit as any).cpf || '');
  const [address, setAddress] = useState((customerToEdit as any).address || '');
  const [birthDate, setBirthDate] = useState((customerToEdit as any).birthDate || '');
  const [status, setStatus] = useState(customerToEdit.status || 'active');
  const [avatarUrl, setAvatarUrl] = useState(customerToEdit.avatarUrl || '');
  const [documentPhoto, setDocumentPhoto] = useState((customerToEdit as any).documentPhoto || '');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stats calculation
  const customerRides = rides.filter(r => r.userId === customerToEdit.id);
  const totalRidesCount = customerRides.length;
  const walletBalance = wallets.find(w => w.id === customerToEdit.id)?.balance || 0;
  const totalSpend = customerRides
    .filter(r => r.status === 'completed')
    .reduce((acc, r) => acc + r.price, 0);

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
        address,
        birthDate,
        status,
        avatarUrl,
        documentPhoto
      };

      if (newPassword.trim()) {
        updateData.tempPassword = newPassword.trim();
        updateData.mustChangePassword = true;
      }

      await updateUserProfileAllFields(customerToEdit.id, updateData);

      const logDesc = `Editou dados do passageiro ${name} (${email}). Status: ${status}.`;
      await logAdminAction(currentAdminEmail, logDesc);

      setSuccessMsg('Ficha técnica do passageiro atualizada com sucesso no Firestore!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do passageiro');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: 'active' | 'blocked') => {
    setLoading(true);
    setErrorMsg('');
    try {
      await updateUserProfileAllFields(customerToEdit.id, { status: newStatus });
      setStatus(newStatus);
      const logDesc = `Alterou status do passageiro ${name} para: ${newStatus.toUpperCase()}`;
      await logAdminAction(currentAdminEmail, logDesc);
      setSuccessMsg(`Passageiro alterado para ${newStatus.toUpperCase()} com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Ficha do Cliente / Passageiro</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-0.5">UID: {customerToEdit.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 flex border-b border-slate-150 gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Ficha Cadastral
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'financial' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Carteira & Saldos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Corridas ({totalRidesCount})
          </button>
        </div>

        {/* Content Form */}
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
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email do Passageiro</label>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                  <ImageUpload
                    label="Foto de Perfil"
                    value={avatarUrl}
                    onChange={(base64) => setAvatarUrl(base64)}
                    onClear={() => setAvatarUrl('')}
                    type="avatar"
                    id="edit-avatar"
                  />
                  <ImageUpload
                    label="Documento de Identidade (RG/CNH)"
                    value={documentPhoto}
                    onChange={(base64) => setDocumentPhoto(base64)}
                    onClear={() => setDocumentPhoto('')}
                    type="document"
                    id="edit-doc"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço de Preferência</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Cidade - Estado"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Account Status Control banner */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Status Administrativo da Conta</span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Liberar ou Bloquear Acesso</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Se bloqueado, o passageiro não conseguirá solicitar corridas pelo App.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === 'active' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Ativo / Desbloqueado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('blocked')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === 'blocked' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Bloquear Conta
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: FINANCIAL / WALLET */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-emerald-500 uppercase font-mono tracking-wider">Carteira Digital & Meios de Pagamento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Saldo em Dinheiro (Pix/Cartão)</span>
                    <div className="text-2xl font-extrabold text-amber-600 mt-1">R$ {walletBalance.toFixed(2)}</div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">Disponível para quitação de corridas automáticas</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Gastos Totais na Plataforma</span>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">R$ {totalSpend.toFixed(2)}</div>
                  <p className="text-[10px] text-slate-400 mt-3">Total desembolsado em corridas completas</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/20 border border-emerald-200/40 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Chave Pix Registrada</span>
                <p className="text-xs text-slate-700 font-semibold mt-1.5">CPF: {cpf || "Não cadastrado"}</p>
                <p className="text-[9.5px] text-slate-400 mt-1">Utilizado para estornos de pagamentos de corridas canceladas.</p>
              </div>
            </div>
          )}

          {/* TAB 3: RIDES HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-purple-500 uppercase font-mono tracking-wider">Histórico de Corridas Solicitadas</span>
              </div>

              {customerRides.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                  Nenhuma corrida solicitada por este usuário de aplicativo.
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {customerRides.map((ride) => (
                    <div key={ride.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                      <div className="min-w-0">
                        <div className="text-slate-800 font-bold truncate">{ride.destAddress}</div>
                        <span className="text-[9.5px] text-slate-400 font-mono block mt-1">
                          Valor pago: R$ {ride.price.toFixed(2)} | Data: {new Date(ride.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono shrink-0 ${
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
                  <span>Salvar Dados</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
