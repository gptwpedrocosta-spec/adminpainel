import React, { useState } from 'react';
import { X, Shield, Mail, Phone, Lock, User, Check, RefreshCw } from 'lucide-react';
import { Admin } from '../types';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { updateAdminProfileAllFields, logAdminAction } from '../services/dbService';

interface AdminEditModalProps {
  adminToEdit: Admin;
  onClose: () => void;
  onSuccess: () => void;
  currentAdminEmail: string;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  adminToEdit,
  onClose,
  onSuccess,
  currentAdminEmail
}) => {
  const [name, setName] = useState(adminToEdit.name);
  const [email, setEmail] = useState(adminToEdit.email);
  const [phone, setPhone] = useState(adminToEdit.phone || '');
  const [role, setRole] = useState(adminToEdit.role);
  const [status, setStatus] = useState(adminToEdit.status);
  const [avatarUrl, setAvatarUrl] = useState(adminToEdit.avatarUrl || '');
  const [permissions, setPermissions] = useState<string[]>(adminToEdit.permissions || []);
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const permissionOptions = [
    { id: 'dashboard', name: 'Dashboard', category: 'Staff', desc: 'Acesso às métricas, faturamento e gráficos centrais' },
    { id: 'registrations', name: 'Gestão de Contas', category: 'Staff', desc: 'Criar, editar e excluir contas de condutores, empresas e staff' },
    { id: 'users', name: 'Passageiros', category: 'Clientes', desc: 'Consulta de fichas, bloqueios e estornos de usuários' },
    { id: 'drivers', name: 'Motoristas', category: 'Clientes', desc: 'Análise de documentação, liberação de CNH e faturamento de pilotos' },
    { id: 'rides', name: 'Corridas', category: 'Operação', desc: 'Monitoramento em tempo real de corridas e rotas do mapa' },
    { id: 'deliveries', name: 'Entregas', category: 'Operação', desc: 'Controle de coletas corporativas e envio de pacotes' },
    { id: 'audit_logs', name: 'Segurança', category: 'Admin', desc: 'Auditoria completa de logs de ações dos operadores de sistema' },
    { id: 'financial', name: 'Financeiro', category: 'Admin', desc: 'Configuração de taxas, repasses de pilotos e planos corporativos' }
  ];

  const handleTogglePerm = (permId: string) => {
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter(p => p !== permId));
    } else {
      setPermissions([...permissions, permId]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData: Partial<Admin> = {
        name,
        email,
        phone,
        role,
        status,
        permissions,
        avatarUrl
      };

      // If new password was typed, we can save it in the Firestore document
      // as a temp password forcing first login change, since Client Auth cannot update password easily without reauth.
      if (newPassword.trim()) {
        (updateData as any).tempPassword = newPassword.trim();
        (updateData as any).mustChangePassword = true;
      }

      await updateAdminProfileAllFields(adminToEdit.id, updateData);
      
      const changesDesc = `Editou administrador ${name} (${email}). Papel: ${role}. Status: ${status}.`;
      await logAdminAction(currentAdminEmail, changesDesc);

      setSuccessMsg('Cadastro do administrador atualizado com sucesso no Firestore!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do administrador');
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
              <Shield size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Editar Administrador</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-0.5">ID: {adminToEdit.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">
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

          <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
            <ImageUpload
              label="Foto de Perfil do Administrador"
              value={avatarUrl}
              onChange={(base64) => setAvatarUrl(base64)}
              onClear={() => setAvatarUrl('')}
              type="avatar"
              id="edit-admin-avatar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Corporativo</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Telefone Celular</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Definir Nova Senha (Opcional)</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Min. 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Se informada, forçará a alteração de senha no próximo login.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo / Nível de Acesso</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Administrador Geral</option>
                <option value="support">Suporte Operacional</option>
                <option value="financial">Financeiro / Faturamento</option>
                <option value="operator">Operador Comercial</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status da Conta</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
              >
                <option value="active">Ativo / Liberado</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso / Bloqueado</option>
              </select>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Matriz de Permissões Corporativas</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissionOptions.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => handleTogglePerm(opt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    permissions.includes(opt.id)
                      ? 'border-amber-400/45 bg-amber-50/10'
                      : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(opt.id)}
                    onChange={() => {}} // handled by click
                    className="mt-0.5 accent-amber-500 pointer-events-none"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-800">{opt.name}</span>
                      <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-500 px-1 py-0.2 rounded-xs">{opt.category}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading} className="bg-amber-400 hover:bg-amber-500 text-slate-950">
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Salvar Alterações</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
