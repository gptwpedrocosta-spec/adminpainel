import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, Shield, ShieldAlert, Bike, User, Building2, Key, 
  Trash2, Eye, UserX, UserCheck, RefreshCw, AlertTriangle, CheckCircle, 
  Mail, Phone, ClipboardList, Info, KeyRound, Plus, HelpCircle, X
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ImageUpload } from '../components/ImageUpload';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../firebase/config';

// DB Services & subscriptions
import { 
  subscribeToUsers, 
  subscribeToDrivers, 
  subscribeToAdmins, 
  subscribeToCompanies, 
  subscribeToWallets, 
  subscribeToRides, 
  subscribeToPlans,
  updateUserStatus,
  updateDriverStatus,
  updateCompany,
  updateAdminProfileAllFields,
  deleteUserAccount,
  deleteDriverAccount,
  deleteAdminAccount,
  deleteCompany,
  createPassenger,
  createDriver,
  createCompany,
  createAdminProfile,
  logAdminAction
} from '../services/dbService';

// Types
import { User as PassengerType, Driver as DriverType, Admin as AdminType, Company as CompanyType, Wallet, Ride, CompanyPlan } from '../types';

// Pre-existing modals
import { AdminEditModal } from '../components/AdminEditModal';
import { DriverEditModal } from '../components/DriverEditModal';
import { CustomerEditModal } from '../components/CustomerEditModal';
import { CompanyEditModal } from '../components/CompanyEditModal';

type UserCategoryFilter = 'all' | 'staff' | 'company' | 'driver' | 'passenger';
type UnifiedUserType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  rawRole: string;
  status: string;
  createdAt: string;
  type: 'staff' | 'driver' | 'passenger' | 'company';
  originalObject: any;
};

export const Users: React.FC = () => {
  const { hasAccess, role: currentRole } = usePermissions();
  const { admin } = useAuth();
  const isSuperAdmin = currentRole === 'super_admin';

  // Subscriptions State
  const [passengers, setPassengers] = useState<PassengerType[]>([]);
  const [drivers, setDrivers] = useState<DriverType[]>([]);
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [plans, setPlans] = useState<CompanyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<UserCategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Modals
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<AdminType | null>(null);
  const [selectedDriverToEdit, setSelectedDriverToEdit] = useState<DriverType | null>(null);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<PassengerType | null>(null);
  const [selectedCompanyToEdit, setSelectedCompanyToEdit] = useState<CompanyType | null>(null);

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationRole, setCreationRole] = useState<'super_admin' | 'admin' | 'support' | 'company' | 'driver' | 'passenger'>('passenger');
  const [creationLoading, setCreationLoading] = useState(false);
  
  // Recovery State
  const [recoveryUser, setRecoveryUser] = useState<UnifiedUserType | null>(null);
  const [recoveryToken, setRecoveryToken] = useState('');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Common form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // Driver specific form states
  const [formCnh, setFormCnh] = useState('');
  const [formEar, setFormEar] = useState(false);
  const [formModel, setFormModel] = useState('');
  const [formBrand, setFormBrand] = useState('Honda');
  const [formColor, setFormColor] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formYear, setFormYear] = useState('');

  // Company specific form states
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formStateReg, setFormStateReg] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formResponsibleRole, setFormResponsibleRole] = useState('');
  const [formPlanId, setFormPlanId] = useState<'basic' | 'corporate' | 'premium'>('basic');
  const [formMonthlyLimit, setFormMonthlyLimit] = useState('1000');

  // Photo & Document Upload States
  const [formAvatar, setFormAvatar] = useState('');
  const [formDocPhoto, setFormDocPhoto] = useState('');
  const [formCnhDoc, setFormCnhDoc] = useState('');
  const [formCrlvDoc, setFormCrlvDoc] = useState('');

  // Subscribe to all datasets in real-time
  useEffect(() => {
    setLoading(true);
    const unsubUsers = subscribeToUsers((data) => setPassengers(data));
    const unsubDrivers = subscribeToDrivers((data) => setDrivers(data));
    const unsubAdmins = subscribeToAdmins((data) => setAdmins(data as AdminType[]));
    const unsubCompanies = subscribeToCompanies((data) => setCompanies(data));
    const unsubWallets = subscribeToWallets((data) => setWallets(data));
    const unsubRides = subscribeToRides((data) => setRides(data));
    const unsubPlans = subscribeToPlans((data) => {
      setPlans(data);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubDrivers();
      unsubAdmins();
      unsubCompanies();
      unsubWallets();
      unsubRides();
      unsubPlans();
    };
  }, []);

  const triggerAlert = (success: boolean, msg: string) => {
    if (success) {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // Compile datasets into a unified users list representation
  const unifiedUsers: UnifiedUserType[] = [];

  // Map Passengers
  passengers.forEach(p => {
    unifiedUsers.push({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      role: 'Passageiro',
      rawRole: 'passenger',
      status: p.status || 'active',
      createdAt: p.createdAt,
      type: 'passenger',
      originalObject: p
    });
  });

  // Map Drivers
  drivers.forEach(d => {
    unifiedUsers.push({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      role: 'Motorista',
      rawRole: 'driver',
      status: d.status || 'pending',
      createdAt: d.createdAt,
      type: 'driver',
      originalObject: d
    });
  });

  // Map Admins/Staff
  admins.forEach(a => {
    unifiedUsers.push({
      id: a.id || a.uid || '',
      name: a.name,
      email: a.email,
      phone: a.phone || 'Sem telefone',
      role: a.role === 'super_admin' ? 'Super Admin' : a.role === 'admin' ? 'Administrador' : 'Suporte',
      rawRole: a.role,
      status: a.status || (a.active ? 'active' : 'suspended'),
      createdAt: a.createdAt || new Date().toISOString(),
      type: 'staff',
      originalObject: a
    });
  });

  // Map Companies
  companies.forEach(c => {
    unifiedUsers.push({
      id: c.id,
      name: c.tradingName || c.companyName,
      email: c.corporateEmail,
      phone: c.phone,
      role: 'Empresa',
      rawRole: 'company',
      status: c.status || 'active',
      createdAt: c.createdAt,
      type: 'company',
      originalObject: c
    });
  });

  // Sort by newest registrations
  unifiedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter combined lists
  const filteredUsers = unifiedUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      categoryFilter === 'all' || 
      u.type === categoryFilter;

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        matchesStatus = u.status === 'active' || u.status === 'approved';
      } else if (statusFilter === 'blocked') {
        matchesStatus = u.status === 'blocked' || u.status === 'inactive' || u.status === 'suspended' || u.status === 'rejected';
      } else if (statusFilter === 'pending') {
        matchesStatus = u.status === 'pending';
      }
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // BLOCK / UNBLOCK ACCOUNT ACTIONS
  const handleToggleBlock = async (user: UnifiedUserType) => {
    const actingAdminEmail = admin?.email || "Super Admin";
    const currentStatus = user.status;
    
    try {
      if (user.type === 'passenger') {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        await updateUserStatus(user.id, newStatus);
        await logAdminAction(actingAdminEmail, `${newStatus === 'blocked' ? 'BLOQUEOU' : 'DESBLOQUEOU'} conta de passageiro: ${user.name} (${user.id})`);
        triggerAlert(true, `Passageiro ${user.name} foi ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} com sucesso.`);
      } 
      else if (user.type === 'driver') {
        const newStatus = currentStatus === 'approved' ? 'inactive' : 'approved';
        await updateDriverStatus(user.id, newStatus);
        await logAdminAction(actingAdminEmail, `${newStatus === 'inactive' ? 'BLOQUEOU (Inativou)' : 'DESBLOQUEOU (Aprovou)'} conta de motorista: ${user.name} (${user.id})`);
        triggerAlert(true, `Motorista ${user.name} foi ${newStatus === 'inactive' ? 'desativado' : 'ativado (aprovado)'}.`);
      } 
      else if (user.type === 'company') {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        await updateCompany(user.id, { status: newStatus });
        await logAdminAction(actingAdminEmail, `${newStatus === 'blocked' ? 'BLOQUEOU' : 'DESBLOQUEOU'} empresa parceira: ${user.name} (${user.id})`);
        triggerAlert(true, `Empresa parceira ${user.name} foi ${newStatus === 'blocked' ? 'bloqueada' : 'desbloqueada'}.`);
      } 
      else if (user.type === 'staff') {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        await updateAdminProfileAllFields(user.id, { status: newStatus, active: newStatus === 'active' });
        await logAdminAction(actingAdminEmail, `${newStatus === 'suspended' ? 'SUSPENDEU' : 'ATIVOU'} administrador de sistema: ${user.name} (${user.id})`);
        triggerAlert(true, `Acesso staff de ${user.name} foi ${newStatus === 'suspended' ? 'suspenso' : 'ativado'}.`);
      }
    } catch (err) {
      triggerAlert(false, `Falha ao alterar status da conta: ${err}`);
    }
  };

  // ACCOUNT RECOVERY SIMULATOR
  const handleTriggerRecovery = async (user: UnifiedUserType) => {
    const actingAdminEmail = admin?.email || "Super Admin";
    setRecoveryUser(user);

    // Simulate link generation
    const mockToken = `token_rec_${Math.floor(100000 + Math.random() * 900000)}`;
    setRecoveryToken(`https://motoja.com.br/recuperar-acesso?user=${user.id}&t=${mockToken}`);

    try {
      // Force status unblocked if blocked
      if (user.status === 'blocked' || user.status === 'inactive' || user.status === 'suspended') {
        if (user.type === 'passenger') await updateUserStatus(user.id, 'active');
        else if (user.type === 'driver') await updateDriverStatus(user.id, 'approved');
        else if (user.type === 'company') await updateCompany(user.id, { status: 'active' });
        else if (user.type === 'staff') await updateAdminProfileAllFields(user.id, { status: 'active', active: true });
      }

      await logAdminAction(actingAdminEmail, `RECUPEROU ACESSO e gerou token para conta: ${user.name} (${user.email})`);
    } catch (err) {
      console.error("Erro na recuperação automática:", err);
    }
  };

  // SAFE PERMANENT DELETION (Super Admin ONLY confirmation check)
  const handleDeleteUserAccount = async (user: UnifiedUserType) => {
    if (!isSuperAdmin) {
      triggerAlert(false, "Acesso negado: Apenas contas de Super Admin podem excluir permanentemente registros do sistema.");
      return;
    }

    const confirm = window.confirm(`ATENÇÃO SUPER ADMIN: Você está prestes a EXCLUIR PERMANENTEMENTE o usuário [${user.name}] (${user.role}) do ecossistema MotoJá. Esta ação excluirá suas carteiras, transações e dados relacionados de forma irreversível. Deseja prosseguir?`);
    if (!confirm) return;

    try {
      const actingAdminEmail = admin?.email || "Super Admin";

      if (user.type === 'passenger') {
        await deleteUserAccount(user.id);
      } else if (user.type === 'driver') {
        await deleteDriverAccount(user.id);
      } else if (user.type === 'company') {
        await deleteCompany(user.id);
      } else if (user.type === 'staff') {
        await deleteAdminAccount(user.id);
      }

      await logAdminAction(actingAdminEmail, `DELETOU PERMANENTEMENTE o perfil: ${user.name} (${user.id}) do tipo ${user.role}`);
      triggerAlert(true, `O perfil de ${user.name} foi removido de forma definitiva.`);
    } catch (err) {
      triggerAlert(false, `Falha na exclusão do registro: ${err}`);
    }
  };

  // DETAILED RECORD EDIT modal launchers
  const handleOpenEditModal = (user: UnifiedUserType) => {
    if (user.type === 'passenger') {
      setSelectedCustomerToEdit(user.originalObject);
    } else if (user.type === 'driver') {
      setSelectedDriverToEdit(user.originalObject);
    } else if (user.type === 'company') {
      setSelectedCompanyToEdit(user.originalObject);
    } else if (user.type === 'staff') {
      setSelectedStaffToEdit(user.originalObject);
    }
  };

  // DYNAMIC UNIFIED ACCOUNT CREATION
  const handleUnifiedRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationLoading(true);

    const actingAdminEmail = admin?.email || "Super Admin";

    try {
      // 1. Passenger Creation
      if (creationRole === 'passenger') {
        if (!formName || !formEmail || !formPhone || !formCpf) {
          throw new Error("Preencha todos os campos obrigatórios do passageiro.");
        }
        await createPassenger({
          name: formName,
          email: formEmail,
          phone: formPhone,
          cpf: formCpf,
          avatarUrl: formAvatar,
          documentPhoto: formDocPhoto
        });
        await logAdminAction(actingAdminEmail, `CRIOU passageiro pelo painel único com fotos salvas: ${formName} (${formEmail})`);
        triggerAlert(true, `Passageiro ${formName} cadastrado com sucesso!`);
      }

      // 2. Driver Creation
      else if (creationRole === 'driver') {
        if (!formName || !formEmail || !formPhone || !formCpf || !formCnh || !formPlate || !formModel) {
          throw new Error("Preencha todos os campos obrigatórios do motorista e veículo.");
        }
        await createDriver({
          name: formName,
          email: formEmail,
          phone: formPhone,
          cpf: formCpf,
          cnh: formCnh,
          ear: formEar,
          vehicle: {
            model: formModel,
            year: formYear || "2024",
            color: formColor || "Preto",
            licensePlate: formPlate
          },
          avatarUrl: formAvatar,
          cnhPhotoUrl: formCnhDoc,
          crlvPhotoUrl: formCrlvDoc
        });
        await logAdminAction(actingAdminEmail, `CRIOU motorista pelo painel único com documentos salvos: ${formName} (Placa: ${formPlate})`);
        triggerAlert(true, `Motorista ${formName} inserido com status PENDENTE de documentação.`);
      }

      // 3. Company Creation
      else if (creationRole === 'company') {
        if (!formCompanyName || !formCnpj || !formEmail || !formPhone || !formResponsible) {
          throw new Error("Preencha todos os campos obrigatórios da empresa.");
        }
        await createCompany({
          companyName: formCompanyName,
          tradingName: formName || formCompanyName,
          cnpj: formCnpj,
          stateRegistration: formStateReg,
          corporateEmail: formEmail,
          phone: formPhone,
          address: "Rua Corporativa, 100",
          logoUrl: formAvatar,
          cnpjPhotoUrl: formDocPhoto,
          responsibleName: formResponsible,
          responsibleRole: formResponsibleRole || "Diretor",
          adminName: formResponsible,
          adminEmail: formEmail,
          adminPhone: formPhone,
          planId: formPlanId,
          status: 'active',
          monthlyLimit: parseFloat(formMonthlyLimit) || 1000,
          spentThisMonth: 0,
          employees: []
        });
        await logAdminAction(actingAdminEmail, `CRIOU empresa parceira pelo painel único com arquivos: ${formCompanyName}`);
        triggerAlert(true, `Empresa parceira ${formCompanyName} integrada com sucesso.`);
      }

      // 4. Admin / Staff creation (using secondary App context to preserve logins)
      else if (creationRole === 'super_admin' || creationRole === 'admin' || creationRole === 'support') {
        if (!formName || !formEmail || !formPassword) {
          throw new Error("Nome, email e senha com mínimo 6 caracteres são obrigatórios para Staff.");
        }
        
        const creatorAppName = `StaffCreator-${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, creatorAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formEmail, formPassword);
          const newUid = userCredential.user.uid;

          // Default staff permission sets
          const perms = ['dashboard', 'users', 'drivers', 'rides', 'deliveries'];
          if (creationRole === 'super_admin' || creationRole === 'admin') {
            perms.push('financial', 'map', 'notifications', 'settings', 'registrations', 'security', 'audit_logs', 'backup_security');
          }

          await createAdminProfile(newUid, formEmail, formName, creationRole, perms, formAvatar, formDocPhoto);
          await logAdminAction(actingAdminEmail, `CRIOU acesso staff com arquivos salvos: ${formName} (${formEmail}) como ${creationRole.toUpperCase()}`);
          triggerAlert(true, `Novo colaborador staff ${formName} registrado com sucesso.`);
        } finally {
          await signOut(secondaryAuth);
        }
      }

      // Clear Form and close modal
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      triggerAlert(false, err.message || "Falha no cadastramento unificado.");
    } finally {
      setCreationLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCpf('');
    setFormPassword('');
    setFormCnh('');
    setFormEar(false);
    setFormModel('');
    setFormColor('');
    setFormPlate('');
    setFormYear('');
    setFormCompanyName('');
    setFormCnpj('');
    setFormStateReg('');
    setFormResponsible('');
    setFormResponsibleRole('');
    setFormPlanId('basic');
    setFormMonthlyLimit('1000');
    setFormAvatar('');
    setFormDocPhoto('');
    setFormCnhDoc('');
    setFormCrlvDoc('');
  };

  return (
    <PageContainer
      title="Painel Único de Usuários"
      subtitle="Visualização centralizada de passageiros, motoristas, empresas parceiras e staff corporativo do ecossistema unificado MotoJá"
    >
      <div className="space-y-6">

        {/* Action Header Card - Stats & Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5">Clientes Passageiros</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <User size={18} />
              </div>
              <div>
                <span className="text-xl font-display font-extrabold text-slate-800">{passengers.length}</span>
                <span className="text-[10px] text-slate-400 block font-medium">Contas de Passageiro</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5">Pilotos Parceiros</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                <Bike size={18} />
              </div>
              <div>
                <span className="text-xl font-display font-extrabold text-slate-800">{drivers.length}</span>
                <span className="text-[10px] text-slate-400 block font-medium">Motoristas Cadastrados</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5">Corporações Parceiras</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                <Building2 size={18} />
              </div>
              <div>
                <span className="text-xl font-display font-extrabold text-slate-800">{companies.length}</span>
                <span className="text-[10px] text-slate-400 block font-medium">Empresas Integradas</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5">Staff Administrativo</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                <Shield size={18} />
              </div>
              <div>
                <span className="text-xl font-display font-extrabold text-slate-800">{admins.length}</span>
                <span className="text-[10px] text-slate-400 block font-medium">Administradores e Suporte</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, email, CPF/CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          {/* Unified Tabs filter */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-150 rounded-xl w-full justify-start md:justify-center">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Todos ({unifiedUsers.length})
            </button>
            <button
              onClick={() => setCategoryFilter('passenger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === 'passenger' ? 'bg-blue-50 text-blue-700 shadow-xs' : 'text-slate-400 hover:text-blue-600'
              }`}
            >
              Passageiros
            </button>
            <button
              onClick={() => setCategoryFilter('driver')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === 'driver' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-emerald-600'
              }`}
            >
              Motoristas
            </button>
            <button
              onClick={() => setCategoryFilter('company')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === 'company' ? 'bg-purple-50 text-purple-700 shadow-xs' : 'text-slate-400 hover:text-purple-600'
              }`}
            >
              Empresas
            </button>
            <button
              onClick={() => setCategoryFilter('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === 'staff' ? 'bg-slate-200 text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Staff Admin
            </button>
          </div>

          {/* Secondary Select dropdown status & action button */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400"
            >
              <option value="all">Status: Todos</option>
              <option value="active">Status: Ativos/Aprovados</option>
              <option value="blocked">Status: Bloqueados/Inativos</option>
              <option value="pending">Status: Pendente</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-98 transition-all"
            >
              <Plus size={14} />
              <span>Criar Usuário</span>
            </button>
          </div>
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw size={24} className="animate-spin text-amber-500 mb-2" />
                <p className="text-xs font-semibold">Carregando dados unificados do ecossistema...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Info size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Nenhum usuário correspondente aos filtros.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">ID & Nome</th>
                    <th className="py-3 px-6">Contato principal</th>
                    <th className="py-3 px-6">Categoria</th>
                    <th className="py-3 px-6">Saldo Carteira</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredUsers.map((user) => {
                    // Check wallet balance
                    const bal = wallets.find(w => w.id === user.id)?.balance || 0;

                    return (
                      <tr key={`${user.type}_${user.id}`} className="hover:bg-slate-50/20 transition-all">
                        <td className="py-3.5 px-6">
                          <div>
                            <span className="font-bold text-slate-800 block truncate max-w-[200px]">{user.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {user.id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="text-slate-700 font-semibold">{user.email}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{user.phone}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-sm uppercase ${
                            user.type === 'staff' ? 'bg-slate-100 text-slate-600' :
                            user.type === 'driver' ? 'bg-emerald-50 text-emerald-600' :
                            user.type === 'company' ? 'bg-purple-50 text-purple-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`font-mono font-bold ${bal < 0 ? 'text-red-500' : bal > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            R$ {bal.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <StatusBadge status={user.status as any} />
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                              title="Visualizar / Editar Ficha"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.status === 'active' || user.status === 'approved'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                              }`}
                              title={user.status === 'active' || user.status === 'approved' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                            >
                              {user.status === 'active' || user.status === 'approved' ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                            <button
                              onClick={() => handleTriggerRecovery(user)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                              title="Recuperar Acesso"
                            >
                              <KeyRound size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteUserAccount(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSuperAdmin 
                                  ? 'bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600' 
                                  : 'opacity-30 bg-slate-100 text-slate-300 cursor-not-allowed'
                              }`}
                              disabled={!isSuperAdmin}
                              title={isSuperAdmin ? "Excluir permanentemente" : "Requer Super Admin"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RECOVERY SIMULATION RESPONSE MODAL */}
        {recoveryUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-150 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <KeyRound size={16} className="text-amber-500" />
                  <span>Recuperação de Acesso Ativa</span>
                </h4>
                <button 
                  onClick={() => setRecoveryUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-xl flex items-start gap-2 leading-relaxed">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span>Chave gerada com sucesso! Conta de {recoveryUser.name} foi desbloqueada (Status: Ativo) na base de dados MotoJá.</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1 tracking-wider">Link para redefinição de acesso</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 select-all break-all leading-normal font-bold">
                    {recoveryToken}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  * A ação foi auditada sob os logs corporativos da conta administrativa {admin?.email}.
                </div>

                <Button 
                  onClick={() => setRecoveryUser(null)} 
                  className="w-full justify-center"
                  variant="primary"
                >
                  Fechar janela
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED CREATION WIZARD MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-150 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
                <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <UserPlus size={16} className="text-amber-500" />
                  <span>Cadastrar Novo Perfil</span>
                </h4>
                <button 
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUnifiedRegister} className="space-y-4 text-xs font-semibold text-slate-700">
                {/* 1. SELECT ROLE */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5 tracking-wider">Nível de Acesso (Tipo)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'passenger', name: 'Passageiro' },
                      { id: 'driver', name: 'Motorista' },
                      { id: 'company', name: 'Empresa' },
                      { id: 'support', name: 'Suporte (Staff)' },
                      { id: 'admin', name: 'Admin (Staff)' },
                      { id: 'super_admin', name: 'Super Admin' }
                    ].map((roleOpt) => (
                      <button
                        key={roleOpt.id}
                        type="button"
                        onClick={() => { setCreationRole(roleOpt.id as any); }}
                        className={`py-2 px-3 border rounded-xl text-center font-bold text-[10px] cursor-pointer transition-all ${
                          creationRole === roleOpt.id 
                            ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {roleOpt.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. DYNAMIC FIELDS FORM */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {/* Common Name */}
                  {creationRole !== 'company' && (
                    <div>
                      <label className="block mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  {/* Company specific titles */}
                  {creationRole === 'company' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1">Razão Social</label>
                        <input 
                          type="text" 
                          required 
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                          placeholder="Ex: Transportes MotoJá S/A"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Nome Fantasia (Apelido)</label>
                        <input 
                          type="text" 
                          required 
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ex: Transportes MotoJá"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Contact Email & Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">{creationRole === 'company' ? 'Email Corporativo' : 'Endereço de Email'}</label>
                      <input 
                        type="email" 
                        required 
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="Ex: contato@email.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Número de Telefone</label>
                      <input 
                        type="text" 
                        required 
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* CPF/CNPJ & Extra document IDs */}
                  {creationRole !== 'super_admin' && creationRole !== 'admin' && creationRole !== 'support' && (
                    <div className="grid grid-cols-2 gap-3">
                      {creationRole === 'company' ? (
                        <>
                          <div>
                            <label className="block mb-1">CNPJ</label>
                            <input 
                              type="text" 
                              required 
                              value={formCnpj}
                              onChange={(e) => setFormCnpj(e.target.value)}
                              placeholder="Ex: 00.000.000/0001-00"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block mb-1">Inscrição Estadual</label>
                            <input 
                              type="text" 
                              value={formStateReg}
                              onChange={(e) => setFormStateReg(e.target.value)}
                              placeholder="Opcional"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block mb-1">Número do CPF</label>
                            <input 
                              type="text" 
                              required 
                              value={formCpf}
                              onChange={(e) => setFormCpf(e.target.value)}
                              placeholder="123.456.789-00"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                            />
                          </div>
                          {creationRole === 'driver' && (
                            <div>
                              <label className="block mb-1">Número da CNH</label>
                              <input 
                                type="text" 
                                required 
                                value={formCnh}
                                onChange={(e) => setFormCnh(e.target.value)}
                                placeholder="Registro CNH"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Driver Specific Vehicle Details */}
                  {creationRole === 'driver' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Dados do Veículo (Moticicleta)</span>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block mb-1 text-[10px]">Modelo / Moto</label>
                          <input 
                            type="text" 
                            required 
                            value={formModel}
                            onChange={(e) => setFormModel(e.target.value)}
                            placeholder="Ex: CG 160 Fan"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px]">Placa Mercosul</label>
                          <input 
                            type="text" 
                            required 
                            value={formPlate}
                            onChange={(e) => setFormPlate(e.target.value)}
                            placeholder="ABC-1234"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px]">Cor</label>
                          <input 
                            type="text" 
                            value={formColor}
                            onChange={(e) => setFormColor(e.target.value)}
                            placeholder="Preta"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="formEar"
                          checked={formEar}
                          onChange={(e) => setFormEar(e.target.checked)}
                          className="w-4 h-4 text-amber-400 bg-slate-50 border-slate-200 rounded-sm focus:ring-2 focus:ring-amber-400"
                        />
                        <label htmlFor="formEar" className="select-none text-[10px] font-mono font-bold text-slate-500 uppercase">CNH com Exercício de Atividade Remunerada (EAR)</label>
                      </div>
                    </div>
                  )}

                  {/* Company specific admin parameters */}
                  {creationRole === 'company' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Responsável Administrativo & Contrato</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-[10px]">Nome do Responsável</label>
                          <input 
                            type="text" 
                            required 
                            value={formResponsible}
                            onChange={(e) => setFormResponsible(e.target.value)}
                            placeholder="Ex: Carlos Albuquerque"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px]">Cargo</label>
                          <input 
                            type="text" 
                            value={formResponsibleRole}
                            onChange={(e) => setFormResponsibleRole(e.target.value)}
                            placeholder="Gestor de Frota"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="block mb-1 text-[10px]">Plano Escolhido</label>
                          <select
                            value={formPlanId}
                            onChange={(e) => setFormPlanId(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="basic">Plano Básico (Lim. 50 corridas)</option>
                            <option value="corporate">Plano Empresarial (Lim. 200 corridas)</option>
                            <option value="premium">Plano Premium (Lim. 1000 corridas)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px]">Limite de Faturamento Mensal (R$)</label>
                          <input 
                            type="number" 
                            value={formMonthlyLimit}
                            onChange={(e) => setFormMonthlyLimit(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Staff Password requirements */}
                  {(creationRole === 'super_admin' || creationRole === 'admin' || creationRole === 'support') && (
                    <div>
                      <label className="block mb-1">Senha de Acesso Inicial</label>
                      <input 
                        type="password" 
                        required 
                        minLength={6}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* Photo and Document uploads */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Fotos e Documentação do Cadastro
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Avatar/Logo/Foto */}
                      <ImageUpload
                        label={creationRole === 'company' ? 'Logotipo da Empresa' : 'Foto de Perfil'}
                        value={formAvatar}
                        onChange={(base64) => setFormAvatar(base64)}
                        onClear={() => setFormAvatar('')}
                        type="avatar"
                        id="form-avatar"
                      />

                      {/* Document uploads based on role */}
                      {creationRole !== 'driver' ? (
                        <ImageUpload
                          label={
                            creationRole === 'company' 
                              ? 'Contrato Social ou CNPJ' 
                              : 'Documento de Identidade (RG/CNH)'
                          }
                          value={formDocPhoto}
                          onChange={(base64) => setFormDocPhoto(base64)}
                          onClear={() => setFormDocPhoto('')}
                          type="document"
                          id="form-doc"
                        />
                      ) : (
                        <>
                          <ImageUpload
                            label="Documento da CNH"
                            value={formCnhDoc}
                            onChange={(base64) => setFormCnhDoc(base64)}
                            onClear={() => setFormCnhDoc('')}
                            type="document"
                            id="form-cnh-doc"
                          />
                          <div className="md:col-span-2">
                            <ImageUpload
                              label="Documento do CRLV"
                              value={formCrlvDoc}
                              onChange={(base64) => setFormCrlvDoc(base64)}
                              onClear={() => setFormCrlvDoc('')}
                              type="document"
                              id="form-crlv-doc"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* 3. SUBMIT OR CANCEL */}
                <div className="border-t border-slate-100 pt-5 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {creationLoading ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    <span>Confirmar Cadastro</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RE-USE EXISTING MODALS */}
        {selectedCustomerToEdit && (
          <CustomerEditModal 
            customerToEdit={selectedCustomerToEdit}
            onClose={() => setSelectedCustomerToEdit(null)}
            onSuccess={() => { setSelectedCustomerToEdit(null); triggerAlert(true, "Dados do passageiro atualizados."); }}
            rides={rides}
            wallets={wallets}
            currentAdminEmail={admin?.email || "Super Admin"}
          />
        )}

        {selectedDriverToEdit && (
          <DriverEditModal 
            driverToEdit={selectedDriverToEdit}
            onClose={() => setSelectedDriverToEdit(null)}
            onSuccess={() => { setSelectedDriverToEdit(null); triggerAlert(true, "Dados do motorista atualizados."); }}
            rides={rides}
            wallets={wallets}
            currentAdminEmail={admin?.email || "Super Admin"}
          />
        )}

        {selectedCompanyToEdit && (
          <CompanyEditModal 
            companyToEdit={selectedCompanyToEdit}
            onClose={() => setSelectedCompanyToEdit(null)}
            onSuccess={() => { setSelectedCompanyToEdit(null); triggerAlert(true, "Dados da empresa atualizados."); }}
            plans={plans}
            rides={rides}
            currentAdminEmail={admin?.email || "Super Admin"}
          />
        )}

        {selectedStaffToEdit && (
          <AdminEditModal 
            adminToEdit={selectedStaffToEdit}
            onClose={() => setSelectedStaffToEdit(null)}
            onSuccess={() => { setSelectedStaffToEdit(null); triggerAlert(true, "Permissões e cadastro staff atualizados."); }}
            currentAdminEmail={admin?.email || "Super Admin"}
          />
        )}

      </div>
    </PageContainer>
  );
};
