import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Shield, Key, Mail, Phone, Lock, User, Bike, 
  AlertCircle, CheckCircle, RefreshCw, Layers, Trash2, 
  Users, Building2, Star, Award, Search, Eye, Filter, Edit3, Settings, Clock, XCircle
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../firebase/config';

// DB Services
import { 
  subscribeToAdmins, deleteAdminAccount, createAdminProfile, logAdminAction,
  subscribeToDrivers, deleteDriverAccount, createDriver, updateDriverStatus,
  subscribeToUsers, deleteUserAccount, createPassenger, updateUserStatus,
  subscribeToCompanies, createCompany, deleteCompany, updateCompany,
  subscribeToPlans, subscribeToWallets, subscribeToRides
} from '../services/dbService';

// Types
import { Admin, Company, CompanyPlan, Driver, User as Passenger, Ride, Wallet } from '../types';

// Modals / Sub-components
import { AdminEditModal } from '../components/AdminEditModal';
import { DriverEditModal } from '../components/DriverEditModal';
import { CustomerEditModal } from '../components/CustomerEditModal';
import { CompanyEditModal } from '../components/CompanyEditModal';
import { PlanSettings } from '../components/PlanSettings';
import { ImageUpload } from '../components/ImageUpload';

type RegistrationsTab = 'admins' | 'drivers' | 'passengers' | 'companies' | 'plans' | 'pending';

export const Registrations: React.FC = () => {
  const { hasAccess } = usePermissions();
  const { admin } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<RegistrationsTab>('admins');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pending Tab Specific States
  const [pendingTypeFilter, setPendingTypeFilter] = useState<'all' | 'driver' | 'company' | 'passenger'>('all');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');

  // Creation forms toggles
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Central Lists States
  const [adminsList, setAdminsList] = useState<Admin[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [passengersList, setPassengersList] = useState<Passenger[]>([]);
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [plansList, setPlansList] = useState<CompanyPlan[]>([]);
  const [walletsList, setWalletsList] = useState<Wallet[]>([]);
  const [ridesList, setRidesList] = useState<Ride[]>([]);

  // Edit Modals states
  const [selectedAdminToEdit, setSelectedAdminToEdit] = useState<Admin | null>(null);
  const [selectedDriverToEdit, setSelectedDriverToEdit] = useState<Driver | null>(null);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<Passenger | null>(null);
  const [selectedCompanyToEdit, setSelectedCompanyToEdit] = useState<Company | null>(null);

  // Real-time synchronization
  useEffect(() => {
    const unsubAdmins = subscribeToAdmins((data) => setAdminsList(data as Admin[]));
    const unsubDrivers = subscribeToDrivers((data) => setDriversList(data));
    const unsubUsers = subscribeToUsers((data) => setPassengersList(data));
    const unsubCompanies = subscribeToCompanies((data) => setCompaniesList(data));
    const unsubPlans = subscribeToPlans((data) => setPlansList(data));
    const unsubWallets = subscribeToWallets((data) => setWalletsList(data));
    const unsubRides = subscribeToRides((data) => setRidesList(data));

    return () => {
      unsubAdmins();
      unsubDrivers();
      unsubUsers();
      unsubCompanies();
      unsubPlans();
      unsubWallets();
      unsubRides();
    };
  }, []);

  const clearMessages = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // --- FORM STATES: ADMIN ---
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admPhone, setAdmPhone] = useState('');
  const [admPassword, setAdmPassword] = useState('');
  const [admRole, setAdmRole] = useState<Admin['role']>('admin');
  const [admPerms, setAdmPerms] = useState<string[]>([
    'dashboard', 'users', 'drivers', 'rides', 'deliveries'
  ]);

  // --- FORM STATES: DRIVER ---
  const [drvName, setDrvName] = useState('');
  const [drvEmail, setDrvEmail] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvCpf, setDrvCpf] = useState('');
  const [drvCnh, setDrvCnh] = useState('');
  const [drvEar, setDrvEar] = useState(true);
  const [drvBirth, setDrvBirth] = useState('');
  const [drvAddress, setDrvAddress] = useState('');
  const [drvPassword, setDrvPassword] = useState('');
  // Vehicle specs
  const [drvBrand, setDrvBrand] = useState('Honda');
  const [drvModel, setDrvModel] = useState('');
  const [drvYear, setDrvYear] = useState('');
  const [drvColor, setDrvColor] = useState('');
  const [drvPlate, setDrvPlate] = useState('');
  const [drvRenavam, setDrvRenavam] = useState('');
  const [drvCrlv, setDrvCrlv] = useState('');
  const [drvAvatarUrl, setDrvAvatarUrl] = useState('');
  const [drvCnhPhotoUrl, setDrvCnhPhotoUrl] = useState('');
  const [drvCrlvPhotoUrl, setDrvCrlvPhotoUrl] = useState('');

  // --- FORM STATES: PASSENGER ---
  const [usrName, setUsrName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPhone, setUsrPhone] = useState('');
  const [usrCpf, setUsrCpf] = useState('');
  const [usrBirth, setUsrBirth] = useState('');
  const [usrAddress, setUsrAddress] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrAvatarUrl, setUsrAvatarUrl] = useState('');
  const [usrDocumentPhoto, setUsrDocumentPhoto] = useState('');

  // --- FORM STATES: COMPANY ---
  const [compCompanyName, setCompCompanyName] = useState('');
  const [compTradingName, setCompTradingName] = useState('');
  const [compCnpj, setCompCnpj] = useState('');
  const [compStateReg, setCompStateReg] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compLogoUrl, setCompLogoUrl] = useState('');
  const [compCnpjPhotoUrl, setCompCnpjPhotoUrl] = useState('');
  const [compContractPhotoUrl, setCompContractPhotoUrl] = useState('');
  const [compRespName, setCompRespName] = useState('');
  const [compRespRole, setCompRespRole] = useState('');
  // Admin credentials of the partner company
  const [compAdminName, setCompAdminName] = useState('');
  const [compAdminEmail, setCompAdminEmail] = useState('');
  const [compAdminPhone, setCompAdminPhone] = useState('');
  const [compAdminPassword, setCompAdminPassword] = useState('');
  // Financial configurations
  const [compPlanId, setCompPlanId] = useState<'basic' | 'corporate' | 'premium'>('basic');
  const [compMonthlyLimit, setCompMonthlyLimit] = useState('1000');
  const [compSpecialRate, setCompSpecialRate] = useState('0');

  // --- HANDLE CREATION: ADMIN ---
  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!hasAccess('registrations')) {
      setErrorMsg("Seu perfil de acesso não possui permissão para cadastrar administradores.");
      return;
    }

    if (admPassword.length < 6) {
      setErrorMsg("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    const creatorAppName = `AdminCreator-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, creatorAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, admEmail, admPassword);
      const newUid = userCredential.user.uid;

      await createAdminProfile(newUid, admEmail, admName, admRole, admPerms);
      
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `CRIOU novo perfil administrativo: ${admName} (${admEmail}) como ${admRole.toUpperCase()}`);

      setSuccessMsg(`Administrador(a) ${admName} registrado(a) com sucesso!`);
      
      // Reset Form
      setAdmName('');
      setAdmEmail('');
      setAdmPhone('');
      setAdmPassword('');
      setAdmPerms(['dashboard', 'users', 'drivers', 'rides', 'deliveries']);
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao registrar administrador.");
    } finally {
      await signOut(secondaryAuth);
      setLoading(false);
    }
  };

  // --- HANDLE CREATION: DRIVER ---
  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!hasAccess('registrations')) {
      setErrorMsg("Seu perfil de acesso não possui permissão para cadastrar motoristas.");
      return;
    }

    if (drvPassword.length < 6) {
      setErrorMsg("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // Create Driver Profile
      await createDriver({
        name: drvName,
        email: drvEmail,
        phone: drvPhone,
        cpf: drvCpf,
        cnh: drvCnh,
        ear: drvEar,
        vehicle: {
          model: drvModel,
          year: drvYear,
          color: drvColor,
          licensePlate: drvPlate
        },
        avatarUrl: drvAvatarUrl,
        cnhPhotoUrl: drvCnhPhotoUrl,
        crlvPhotoUrl: drvCrlvPhotoUrl
      });

      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `CRIOU novo motorista parceiro: ${drvName} (Placa: ${drvPlate})`);

      setSuccessMsg(`Motorista parceiro(a) ${drvName} inserido no sistema com status PENDENTE de aprovação.`);
      
      // Reset Form
      setDrvName('');
      setDrvEmail('');
      setDrvPhone('');
      setDrvCpf('');
      setDrvCnh('');
      setDrvModel('');
      setDrvYear('');
      setDrvColor('');
      setDrvPlate('');
      setDrvPassword('');
      setDrvBirth('');
      setDrvAddress('');
      setDrvRenavam('');
      setDrvCrlv('');
      setDrvAvatarUrl('');
      setDrvCnhPhotoUrl('');
      setDrvCrlvPhotoUrl('');
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao cadastrar motorista.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE CREATION: PASSENGER ---
  const handleRegisterPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!hasAccess('registrations')) {
      setErrorMsg("Seu perfil de acesso não possui permissão para cadastrar passageiros.");
      return;
    }

    if (usrPassword.length < 6) {
      setErrorMsg("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await createPassenger({
        name: usrName,
        email: usrEmail,
        phone: usrPhone,
        cpf: usrCpf,
        avatarUrl: usrAvatarUrl,
        documentPhoto: usrDocumentPhoto
      });

      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `CRIOU novo passageiro de aplicativo: ${usrName} (${usrEmail})`);

      setSuccessMsg(`Passageiro(a) ${usrName} cadastrado com sucesso com carteira digital integrada.`);
      
      // Reset Form
      setUsrName('');
      setUsrEmail('');
      setUsrPhone('');
      setUsrCpf('');
      setUsrPassword('');
      setUsrBirth('');
      setUsrAddress('');
      setUsrAvatarUrl('');
      setUsrDocumentPhoto('');
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao cadastrar passageiro.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE CREATION: COMPANY ---
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!hasAccess('registrations')) {
      setErrorMsg("Seu perfil de acesso não possui permissão para cadastrar empresas parceiras.");
      return;
    }

    setLoading(true);
    try {
      await createCompany({
        companyName: compCompanyName,
        tradingName: compTradingName,
        cnpj: compCnpj,
        stateRegistration: compStateReg,
        corporateEmail: compEmail,
        phone: compPhone,
        address: compAddress,
        logoUrl: compLogoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(compTradingName),
        cnpjPhotoUrl: compCnpjPhotoUrl,
        contractPhotoUrl: compContractPhotoUrl,
        responsibleName: compRespName,
        responsibleRole: compRespRole,
        adminName: compAdminName,
        adminEmail: compAdminEmail,
        adminPhone: compAdminPhone,
        planId: compPlanId,
        status: 'active',
        monthlyLimit: Number(compMonthlyLimit),
        spentThisMonth: 0,
        specialRatePerKm: Number(compSpecialRate) || 0,
        employees: []
      });

      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `CRIOU nova empresa parceira: ${compTradingName} (CNPJ: ${compCnpj})`);

      setSuccessMsg(`Empresa parceira ${compTradingName} cadastrada e liberada com sucesso!`);
      
      // Reset Form
      setCompCompanyName('');
      setCompTradingName('');
      setCompCnpj('');
      setCompStateReg('');
      setCompEmail('');
      setCompPhone('');
      setCompAddress('');
      setCompLogoUrl('');
      setCompCnpjPhotoUrl('');
      setCompContractPhotoUrl('');
      setCompRespName('');
      setCompRespRole('');
      setCompAdminName('');
      setCompAdminEmail('');
      setCompAdminPhone('');
      setCompAdminPassword('');
      setCompMonthlyLimit('1000');
      setCompSpecialRate('0');
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao cadastrar empresa.");
    } finally {
      setLoading(false);
    }
  };

  // --- DELETIONS ---
  const handleDeleteAdminAction = async (item: Admin) => {
    if (item.email === 'motojadmin@admin.com' || item.email === admin?.email) {
      alert("Não é permitido excluir a conta mestre do Super Administrador ou o seu próprio perfil ativo.");
      return;
    }

    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente o perfil administrativo de ${item.name}? O acesso será revogado de forma irreversível.`)) {
      return;
    }

    try {
      await deleteAdminAccount(item.id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `EXCLUIU permanentemente o perfil administrativo: ${item.name} (${item.email})`);
      setSuccessMsg(`Administrador(a) ${item.name} excluído(a) com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao excluir administrador: " + err.message);
    }
  };

  const handleDeleteDriverAction = async (item: Driver) => {
    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente o piloto parceiro ${item.name} (${item.vehicle.licensePlate})? Todos os dados associados de carteira digital e histórico serão apagados do sistema.`)) {
      return;
    }

    try {
      await deleteDriverAccount(item.id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `EXCLUIU permanentemente o piloto parceiro: ${item.name} (Placa: ${item.vehicle.licensePlate})`);
      setSuccessMsg(`Piloto ${item.name} removido definitivamente com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao excluir piloto: " + err.message);
    }
  };

  const handleDeletePassengerAction = async (item: Passenger) => {
    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente o passageiro de aplicativo ${item.name}? Todos os históricos de corridas, saldos e carteiras vinculadas serão deletados.`)) {
      return;
    }

    try {
      await deleteUserAccount(item.id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `EXCLUIU permanentemente o passageiro de aplicativo: ${item.name} (${item.email})`);
      setSuccessMsg(`Passageiro ${item.name} removido do sistema com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao excluir passageiro: " + err.message);
    }
  };

  const handleDeleteCompanyAction = async (item: Company) => {
    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente a empresa parceira ${item.tradingName}? A cota corporativa de todos os funcionários vinculados será cancelada imediatamente.`)) {
      return;
    }

    try {
      await deleteCompany(item.id);
      const actingAdminName = admin?.email || "Super Admin";
      await logAdminAction(actingAdminName, `EXCLUIU permanentemente a empresa parceira: ${item.tradingName} (CNPJ: ${item.cnpj})`);
      setSuccessMsg(`Empresa parceira ${item.tradingName} excluída com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao excluir empresa parceira: " + err.message);
    }
  };

  const handleApprovePending = async (id: string, type: 'driver' | 'company' | 'passenger', name: string) => {
    try {
      setLoading(true);
      const actingAdminName = admin?.email || "Super Admin";
      if (type === 'driver') {
        await updateDriverStatus(id, 'approved');
        await logAdminAction(actingAdminName, `APROVOU credenciamento do motorista parceiro: ${name}`);
      } else if (type === 'company') {
        await updateCompany(id, { status: 'active' });
        await logAdminAction(actingAdminName, `APROVOU cadastro da empresa parceira: ${name}`);
      } else if (type === 'passenger') {
        await updateUserStatus(id, 'active');
        await logAdminAction(actingAdminName, `APROVOU cadastro do passageiro: ${name}`);
      }
      setSuccessMsg(`Cadastro de ${name} aprovado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao aprovar cadastro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPending = async (id: string, type: 'driver' | 'company' | 'passenger', name: string) => {
    if (!window.confirm(`Deseja realmente REJEITAR o cadastro de ${name}?`)) {
      return;
    }
    try {
      setLoading(true);
      const actingAdminName = admin?.email || "Super Admin";
      if (type === 'driver') {
        await updateDriverStatus(id, 'rejected');
        await logAdminAction(actingAdminName, `REJEITOU credenciamento do motorista parceiro: ${name}`);
      } else if (type === 'company') {
        await updateCompany(id, { status: 'blocked' });
        await logAdminAction(actingAdminName, `REJEITOU cadastro da empresa parceira: ${name}`);
      } else if (type === 'passenger') {
        await updateUserStatus(id, 'blocked');
        await logAdminAction(actingAdminName, `REJEITOU cadastro do passageiro: ${name}`);
      }
      setSuccessMsg(`Cadastro de ${name} rejeitado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Erro ao rejeitar cadastro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Permission Options Helper
  const permissionsOptionsMatrix = [
    { id: 'dashboard', category: 'OPERACIONAL', name: 'Dashboard', desc: 'Acesso total aos indicadores e gráficos de faturamento.' },
    { id: 'users', category: 'OPERACIONAL', name: 'Gestão de Usuários', desc: 'Ver, suspender ou banir passageiros da plataforma.' },
    { id: 'drivers', category: 'OPERACIONAL', name: 'Gestão de Pilotos', desc: 'Ver e gerenciar credenciamento de condutores parceiros.' },
    { id: 'rides', category: 'OPERACIONAL', name: 'Painel de Corridas', desc: 'Monitorar e cancelar corridas em andamento.' },
    { id: 'deliveries', category: 'OPERACIONAL', name: 'Monitoramento de Entregas', desc: 'Ver remessas, status e histórico logístico.' },
    { id: 'financial', category: 'FINANCEIRO', name: 'Demonstrativo Financeiro', desc: 'Acessar balanços de tarifas, repasses e lucros.' },
    { id: 'registrations', category: 'CADASTROS', name: 'Gestão de Contas', desc: 'Criar, editar e excluir contas de condutores, empresas e staff.' }
  ];

  const handleToggleFormPerm = (permId: string) => {
    if (admPerms.includes(permId)) {
      setAdmPerms(admPerms.filter(p => p !== permId));
    } else {
      setAdmPerms([...admPerms, permId]);
    }
  };

  // Filtering Logic
  const filteredAdmins = adminsList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDrivers = driversList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || item.vehicle.licensePlate.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPassengers = passengersList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || (item.phone && item.phone.includes(term));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCompanies = companiesList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.tradingName.toLowerCase().includes(term) || item.companyName.toLowerCase().includes(term) || item.cnpj.includes(term);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pending lists & calculation
  const pendingDrivers = driversList.filter(d => d.status === 'pending');
  const pendingCompanies = companiesList.filter(c => c.status === 'pending');
  const pendingPassengers = passengersList.filter(p => p.status === 'pending');

  const allPendingItems = [
    ...pendingDrivers.map(d => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      type: 'driver' as const,
      typeName: 'Motorista',
      detail1: d.vehicle ? `Moto: ${d.vehicle.model} (${d.vehicle.color})` : 'Sem veículo cadastrado',
      detail2: d.vehicle ? `Placa: ${d.vehicle.licensePlate}` : '',
      cnh: (d as any).cnh || '',
      cpf: (d as any).cpf || '',
      createdAt: d.createdAt,
      original: d
    })),
    ...pendingCompanies.map(c => ({
      id: c.id,
      name: c.tradingName,
      email: c.corporateEmail,
      phone: c.phone,
      type: 'company' as const,
      typeName: 'Empresa',
      detail1: `Razão Social: ${c.companyName}`,
      detail2: `CNPJ: ${c.cnpj}`,
      cnh: '',
      cpf: '',
      createdAt: c.createdAt,
      original: c
    })),
    ...pendingPassengers.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      type: 'passenger' as const,
      typeName: 'Passageiro',
      detail1: `CPF: ${(p as any).cpf || 'N/A'}`,
      detail2: `Cadastro Realizado`,
      cnh: '',
      cpf: (p as any).cpf || '',
      createdAt: p.createdAt,
      original: p
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPendingCount = allPendingItems.length;

  const filteredPendingItems = allPendingItems.filter(item => {
    const term = pendingSearchTerm.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(term) || 
      item.email.toLowerCase().includes(term) || 
      (item.phone && item.phone.includes(term)) || 
      item.detail1.toLowerCase().includes(term) ||
      item.detail2.toLowerCase().includes(term);
    const matchesType = pendingTypeFilter === 'all' || item.type === pendingTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <PageContainer
      title="Gestão Central de Contas"
      subtitle="Painel administrativo unificado para governança total de acessos de condutores, staff, passageiros corporativos e planos B2B"
    >
      <div className="space-y-6">
        
        {/* Module Navigation Tabs */}
        <div className="bg-white p-1.5 border border-slate-150 rounded-2xl shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => { setActiveTab('admins'); clearMessages(); setShowCreateForm(false); setSearchTerm(''); setStatusFilter('all'); }}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admins' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Shield size={15} />
            <span>Administradores ({adminsList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('drivers'); clearMessages(); setShowCreateForm(false); setSearchTerm(''); setStatusFilter('all'); }}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'drivers' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bike size={15} />
            <span>Motoristas ({driversList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('passengers'); clearMessages(); setShowCreateForm(false); setSearchTerm(''); setStatusFilter('all'); }}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'passengers' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Passageiros ({passengersList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('companies'); clearMessages(); setShowCreateForm(false); setSearchTerm(''); setStatusFilter('all'); }}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'companies' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Building2 size={15} />
            <span>Empresas Parceiras ({companiesList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('plans'); clearMessages(); setShowCreateForm(false); }}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'plans' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Settings size={15} />
            <span>Planos Corporativos</span>
          </button>

          <button
            onClick={() => { setActiveTab('pending'); clearMessages(); setShowCreateForm(false); }}
            className={`flex-1 min-w-[125px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'pending' ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-300' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Clock size={15} className={totalPendingCount > 0 ? "animate-pulse" : ""} />
            <span>Cadastros Pendentes</span>
            {totalPendingCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shrink-0">
                {totalPendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Message banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ação Executada com Sucesso</p>
              <p className="font-normal text-[11px] mt-1 text-emerald-700 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso do Sistema</p>
              <p className="font-normal text-[11px] mt-1 text-rose-700 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT: ADMINS --- */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar administradores..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'outline' : 'secondary'}
                >
                  {showCreateForm ? "Fechar Formulário" : "Novo Administrador"}
                </Button>
              </div>
            </div>

            {/* Admin Creation Form */}
            {showCreateForm && (
              <form onSubmit={handleRegisterAdmin} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start bg-slate-50/50 p-6 rounded-2xl border border-slate-150 animate-in slide-in-from-top-4 duration-200">
                <div className="lg:col-span-2 space-y-4">
                  <div className="pb-2 border-b border-slate-200 flex items-center gap-1.5">
                    <Shield size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">Credenciais Staff Administrativo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Souza"
                        value={admName}
                        onChange={(e) => setAdmName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email Corporativo</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: joao@motoja.com"
                        value={admEmail}
                        onChange={(e) => setAdmEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Senha de Entrada</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={admPassword}
                        onChange={(e) => setAdmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cargo / Papel</label>
                      <select
                        value={admRole}
                        onChange={(e: any) => setAdmRole(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Administrador Geral</option>
                        <option value="support">Suporte</option>
                        <option value="financial">Financeiro</option>
                        <option value="operator">Operador</option>
                      </select>
                    </div>
                  </div>

                  {/* Permissions Selection Grid */}
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Atribuição de Permissões</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {permissionsOptionsMatrix.map((opt) => (
                        <div 
                          key={opt.id}
                          onClick={() => handleToggleFormPerm(opt.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                            admPerms.includes(opt.id)
                              ? 'border-amber-400/40 bg-amber-50/20'
                              : 'border-slate-150 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={admPerms.includes(opt.id)}
                            onChange={() => {}}
                            className="mt-0.5 accent-amber-500 pointer-events-none"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block">{opt.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">{opt.category}</span>
                            <p className="text-[9.5px] text-slate-400 leading-normal mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase block">Gravação em Nuvem</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A conta será gravada de forma síncrona tanto no Firebase Authentication corporativo quanto na coleção de governança "admins" do Firestore.
                  </p>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center bg-amber-400 hover:bg-amber-500 text-slate-950"
                  >
                    {loading ? "Registrando..." : "Confirmar Criação"}
                  </Button>
                </div>
              </form>
            )}

            {/* Admins List Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Administrador</th>
                    <th className="py-3 px-6">Email / Contato</th>
                    <th className="py-3 px-6">Nível Acesso</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAdmins.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 block">ID: {item.id}</span>
                      </td>
                      <td className="py-3 px-6 font-semibold">{item.email}</td>
                      <td className="py-3 px-6">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] font-bold rounded-sm uppercase">
                          {item.role || 'admin'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {(item.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAdminToEdit(item)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Editar Administrador"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdminAction(item)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Excluir Administrador"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                        Nenhum administrador encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT: DRIVERS --- */}
        {activeTab === 'drivers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar pilotos, placas..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-150 rounded-xl">
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Todos ({driversList.length})
                </button>
                <button 
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'pending' ? 'bg-amber-100 text-amber-800 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Pendentes ({driversList.filter(d => d.status === 'pending').length})
                </button>
                <button 
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'active' ? 'bg-emerald-100 text-emerald-800 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Aprovados ({driversList.filter(d => d.status === 'active').length})
                </button>
                <button 
                  onClick={() => setStatusFilter('blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'blocked' ? 'bg-rose-100 text-rose-800 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Bloqueados ({driversList.filter(d => d.status === 'blocked').length})
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'outline' : 'secondary'}
                >
                  {showCreateForm ? "Fechar" : "Novo Condutor"}
                </Button>
              </div>
            </div>

            {/* Driver Creation Form */}
            {showCreateForm && (
              <form onSubmit={handleRegisterDriver} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-150 space-y-5 animate-in slide-in-from-top-4 duration-200">
                <div className="pb-1.5 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Cadastro de Condutor e Ficha de Moto</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Santos"
                      value={drvName}
                      onChange={(e) => setDrvName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@gmail.com"
                      value={drvEmail}
                      onChange={(e) => setDrvEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Telefone</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={drvPhone}
                      onChange={(e) => setDrvPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      placeholder="123.456.789-00"
                      value={drvCpf}
                      onChange={(e) => setDrvCpf(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">CNH Registro</label>
                    <input
                      type="text"
                      required
                      placeholder="CNH Física"
                      value={drvCnh}
                      onChange={(e) => setDrvCnh(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Senha Entrada</label>
                    <input
                      type="password"
                      required
                      placeholder="Mín. 6 dígitos"
                      value={drvPassword}
                      onChange={(e) => setDrvPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Marca Moto</label>
                    <input
                      type="text"
                      required
                      placeholder="Honda ou Yamaha"
                      value={drvBrand}
                      onChange={(e) => setDrvBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Modelo Moto</label>
                    <input
                      type="text"
                      required
                      placeholder="CG 160 Titan"
                      value={drvModel}
                      onChange={(e) => setDrvModel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Placa Moto</label>
                    <input
                      type="text"
                      required
                      placeholder="ABC1D23"
                      value={drvPlate}
                      onChange={(e) => setDrvPlate(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cor Moto</label>
                    <input
                      type="text"
                      required
                      placeholder="Preto"
                      value={drvColor}
                      onChange={(e) => setDrvColor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Ano Moto</label>
                    <input
                      type="number"
                      required
                      placeholder="2022"
                      value={drvYear}
                      onChange={(e) => setDrvYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex items-center pt-6 pl-2">
                    <input
                      type="checkbox"
                      id="create_drv_ear"
                      checked={drvEar}
                      onChange={(e) => setDrvEar(e.target.checked)}
                      className="accent-amber-500 mr-2 h-4 w-4"
                    />
                    <label htmlFor="create_drv_ear" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">EAR na CNH</label>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-800 block mb-3">Documentos e Fotos do Condutor</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-200 rounded-2xl">
                    <ImageUpload
                      label="Foto de Perfil do Piloto"
                      value={drvAvatarUrl}
                      onChange={(base64) => setDrvAvatarUrl(base64)}
                      onClear={() => setDrvAvatarUrl('')}
                      type="avatar"
                      id="create-drv-avatar"
                    />
                    <ImageUpload
                      label="CNH (Frente e Verso)"
                      value={drvCnhPhotoUrl}
                      onChange={(base64) => setDrvCnhPhotoUrl(base64)}
                      onClear={() => setDrvCnhPhotoUrl('')}
                      type="document"
                      id="create-drv-cnh"
                    />
                    <ImageUpload
                      label="CRLV (Documento da Moto)"
                      value={drvCrlvPhotoUrl}
                      onChange={(base64) => setDrvCrlvPhotoUrl(base64)}
                      onClear={() => setDrvCrlvPhotoUrl('')}
                      type="document"
                      id="create-drv-crlv"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" className="bg-amber-400 text-slate-950 font-bold px-6">
                    Salvar Novo Condutor
                  </Button>
                </div>
              </form>
            )}

            {/* Drivers Table list */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Condutor</th>
                    <th className="py-3 px-6">Veículo / Placa</th>
                    <th className="py-3 px-6">CPF / CNH</th>
                    <th className="py-3 px-6">Reputação</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredDrivers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[9.5px] font-mono text-slate-400 block">{item.email}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-slate-800 block font-bold">{item.vehicle.model} ({item.vehicle.color})</span>
                        <span className="text-[10px] text-amber-600 block font-mono font-bold">{item.vehicle.licensePlate}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="block text-[11px] text-slate-600">CPF: {item.cpf}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">CNH: {item.cnh}</span>
                      </td>
                      <td className="py-3 px-6 font-bold text-slate-800 flex items-center gap-1 mt-1.5">
                        <span>{((item as any).rating || 4.9).toFixed(1)}</span>
                        <Star size={13} className="fill-amber-400 stroke-amber-500 shrink-0" />
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                          item.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {(item.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDriverToEdit(item)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Visualizar Ficha"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDriverAction(item)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Deletar Piloto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        Nenhum condutor correspondente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT: PASSENGERS --- */}
        {activeTab === 'passengers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar passageiros..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'outline' : 'secondary'}
                >
                  {showCreateForm ? "Fechar" : "Novo Passageiro"}
                </Button>
              </div>
            </div>

            {/* Passenger creation Form */}
            {showCreateForm && (
              <form onSubmit={handleRegisterPassenger} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-150 space-y-4 animate-in slide-in-from-top-4 duration-200">
                <div className="pb-1.5 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Ficha do Novo Passageiro</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pedro de Souza"
                      value={usrName}
                      onChange={(e) => setUsrName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="pedro.souza@gmail.com"
                      value={usrEmail}
                      onChange={(e) => setUsrEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Telefone Celular</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98888-8888"
                      value={usrPhone}
                      onChange={(e) => setUsrPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      placeholder="123.456.789-01"
                      value={usrCpf}
                      onChange={(e) => setUsrCpf(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Senha de Login</label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={usrPassword}
                      onChange={(e) => setUsrPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-800 block mb-3">Fotos e Documentação do Passageiro</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 border border-slate-200 rounded-2xl">
                    <ImageUpload
                      label="Foto de Perfil do Passageiro"
                      value={usrAvatarUrl}
                      onChange={(base64) => setUsrAvatarUrl(base64)}
                      onClear={() => setUsrAvatarUrl('')}
                      type="avatar"
                      id="create-usr-avatar"
                    />
                    <ImageUpload
                      label="Documento de Identidade (RG/CNH)"
                      value={usrDocumentPhoto}
                      onChange={(base64) => setUsrDocumentPhoto(base64)}
                      onClear={() => setUsrDocumentPhoto('')}
                      type="document"
                      id="create-usr-doc"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" className="bg-amber-400 text-slate-950 font-bold">
                    Cadastrar Passageiro
                  </Button>
                </div>
              </form>
            )}

            {/* Passengers Table list */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Passageiro</th>
                    <th className="py-3 px-6">Contato / Celular</th>
                    <th className="py-3 px-6">CPF</th>
                    <th className="py-3 px-6">Saldo Carteira</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredPassengers.map((item) => {
                    const balance = walletsList.find(w => w.id === item.id)?.balance || 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-6">
                          <span className="font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-[9.5px] font-mono text-slate-400 block">ID: {item.id}</span>
                        </td>
                        <td className="py-3 px-6">
                          <span className="block text-slate-700">{item.email}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{item.phone}</span>
                        </td>
                        <td className="py-3 px-6 text-slate-600">{(item as any).cpf || '---'}</td>
                        <td className="py-3 px-6 font-bold text-amber-600">R$ {balance.toFixed(2)}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                            item.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {(item.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCustomerToEdit(item)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                              title="Visualizar Carteira"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleDeletePassengerAction(item)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Remover Passageiro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPassengers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        Nenhum passageiro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT: COMPANIES --- */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar empresas, CNPJ..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'outline' : 'secondary'}
                >
                  {showCreateForm ? "Fechar" : "Nova Empresa Parceira"}
                </Button>
              </div>
            </div>

            {/* Company Creation Form */}
            {showCreateForm && (
              <form onSubmit={handleRegisterCompany} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-150 space-y-5 animate-in slide-in-from-top-4 duration-200">
                <div className="pb-1.5 border-b border-slate-200 flex items-center gap-1.5">
                  <Building2 size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">Contrato de Parceria Corporativa (B2B)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Razão Social</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: MotoJá Serviços Corporativos Ltda"
                      value={compCompanyName}
                      onChange={(e) => setCompCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: MotoJá B2B"
                      value={compTradingName}
                      onChange={(e) => setCompTradingName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">CNPJ</label>
                    <input
                      type="text"
                      required
                      placeholder="12.345.678/0001-99"
                      value={compCnpj}
                      onChange={(e) => setCompCnpj(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      placeholder="Isento ou Nº"
                      value={compStateReg}
                      onChange={(e) => setCompStateReg(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Telefone Sede</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 4002-8922"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email Comercial</label>
                    <input
                      type="email"
                      required
                      placeholder="b2b@motoja.com"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Endereço Administrativo</label>
                    <input
                      type="text"
                      required
                      placeholder="Rua das Flores, 123 - Centro"
                      value={compAddress}
                      onChange={(e) => setCompAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="pb-1.5 border-b border-slate-200 pt-2">
                  <span className="text-[11px] font-bold text-slate-800">Responsável pelo Contrato</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Ramos"
                      value={compRespName}
                      onChange={(e) => setCompRespName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cargo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Diretor de RH"
                      value={compRespRole}
                      onChange={(e) => setCompRespRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="pb-1.5 border-b border-slate-200 pt-2">
                  <span className="text-[11px] font-bold text-slate-800">Conta de Login Administrativo da Empresa</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome do Operador</label>
                    <input
                      type="text"
                      required
                      placeholder="Admin da Empresa"
                      value={compAdminName}
                      onChange={(e) => setCompAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email de Login</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@empresa.com"
                      value={compAdminEmail}
                      onChange={(e) => setCompAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Telefone Operador</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 97777-5555"
                      value={compAdminPhone}
                      onChange={(e) => setCompAdminPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Senha de Entrada</label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={compAdminPassword}
                      onChange={(e) => setCompAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="pb-1.5 border-b border-slate-200 pt-2">
                  <span className="text-[11px] font-bold text-slate-800">Parâmetros Financeiros</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Plano Inicial</label>
                    <select
                      value={compPlanId}
                      onChange={(e: any) => setCompPlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="basic">Plano Básico corporativo</option>
                      <option value="corporate">Plano Empresarial corporativo</option>
                      <option value="premium">Plano Premium corporativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Limite de Faturamento Mensal (R$)</label>
                    <input
                      type="number"
                      value={compMonthlyLimit}
                      onChange={(e) => setCompMonthlyLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Taxa Especial p/ Km (R$ - Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={compSpecialRate}
                      onChange={(e) => setCompSpecialRate(e.target.value)}
                      placeholder="0.00 (Tarifa padrão do plano)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-800 block mb-3">Logotipo e Documentação Fiscal da Empresa</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-200 rounded-2xl">
                    <ImageUpload
                      label="Logotipo da Empresa"
                      value={compLogoUrl}
                      onChange={(base64) => setCompLogoUrl(base64)}
                      onClear={() => setCompLogoUrl('')}
                      type="avatar"
                      id="create-comp-logo"
                    />
                    <ImageUpload
                      label="Contrato Social / Estatuto"
                      value={compContractPhotoUrl}
                      onChange={(base64) => setCompContractPhotoUrl(base64)}
                      onClear={() => setCompContractPhotoUrl('')}
                      type="document"
                      id="create-comp-contract"
                    />
                    <ImageUpload
                      label="Comprovante de CNPJ"
                      value={compCnpjPhotoUrl}
                      onChange={(base64) => setCompCnpjPhotoUrl(base64)}
                      onClear={() => setCompCnpjPhotoUrl('')}
                      type="document"
                      id="create-comp-cnpj"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" className="bg-amber-400 text-slate-950 font-bold px-8">
                    Cadastrar e Ativar Empresa
                  </Button>
                </div>
              </form>
            )}

            {/* Companies Table list */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Empresa Parceira</th>
                    <th className="py-3 px-6">CNPJ / Responsável</th>
                    <th className="py-3 px-6">Plano Corporativo</th>
                    <th className="py-3 px-6">Gasto / Limite</th>
                    <th className="py-3 px-6">Funcionários</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredCompanies.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-bold text-slate-800 block">{item.tradingName}</span>
                        <span className="text-[9.5px] font-mono text-slate-400 block">{item.companyName}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="block text-slate-600">CNPJ: {item.cnpj}</span>
                        <span className="block text-[10px] text-slate-400">Gestor: {item.responsibleName}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 font-mono text-[9px] font-bold rounded-sm uppercase">
                          {item.planId}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-slate-800 block font-bold">R$ {item.spentThisMonth.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Limite: R$ {item.monthlyLimit.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[10.5px]">
                          {(item.employees || []).length} un
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {(item.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCompanyToEdit(item)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Editar Parceria"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCompanyAction(item)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Excluir Parceria"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        Nenhuma empresa corporativa vinculada encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT: PLANS CONFIGURATION --- */}
        {activeTab === 'plans' && (
          <PlanSettings 
            plans={plansList}
            onSuccess={() => {}}
            currentAdminEmail={admin?.email || "Super Admin"}
          />
        )}

        {/* --- MAIN TAB CONTENT: PENDING REGISTRATIONS --- */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-850">Fila Unificada de Homologação</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 max-w-2xl">
                    Revise minuciosamente os documentos fiscais (CNPJ, Contrato Social), CNH de condutores e dados cadastrais antes de aprovar a entrada de novos parceiros no ecossistema operacional da plataforma.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-150 rounded-xl shadow-xs shrink-0">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[11px] font-bold text-slate-600">Aguardando Avaliação: {totalPendingCount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-150 rounded-2xl shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar nos pendentes..." 
                  value={pendingSearchTerm}
                  onChange={(e) => setPendingSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-1.5 flex-wrap w-full sm:w-auto justify-end">
                <button
                  onClick={() => setPendingTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    pendingTypeFilter === 'all' 
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Todos ({allPendingItems.length})
                </button>
                <button
                  onClick={() => setPendingTypeFilter('driver')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    pendingTypeFilter === 'driver' 
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Motoristas ({pendingDrivers.length})
                </button>
                <button
                  onClick={() => setPendingTypeFilter('company')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    pendingTypeFilter === 'company' 
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Empresas ({pendingCompanies.length})
                </button>
                <button
                  onClick={() => setPendingTypeFilter('passenger')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    pendingTypeFilter === 'passenger' 
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Passageiros ({pendingPassengers.length})
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="py-3.5 px-6">Tipo / Cadastro</th>
                      <th className="py-3.5 px-6">Contato</th>
                      <th className="py-3.5 px-6">Detalhes do Registro</th>
                      <th className="py-3.5 px-6">Data de Cadastro</th>
                      <th className="py-3.5 px-6 text-right">Homologação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredPendingItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide ${
                              item.type === 'driver' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              item.type === 'company' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {item.typeName.toUpperCase()}
                            </span>
                            <div>
                              <span className="font-bold text-slate-850 block text-[13px]">{item.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="block text-slate-600 text-[11.5px]">{item.email}</span>
                          <span className="block text-[10.5px] text-slate-400 mt-0.5">{item.phone}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-700 block text-[11.5px] font-bold">{item.detail1}</span>
                          {item.detail2 && <span className="text-[10.5px] text-slate-400 block mt-0.5 font-mono">{item.detail2}</span>}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (item.type === 'driver') setSelectedDriverToEdit(item.original as Driver);
                                else if (item.type === 'company') setSelectedCompanyToEdit(item.original as Company);
                                else if (item.type === 'passenger') setSelectedCustomerToEdit(item.original as Passenger);
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
                              title="Analisar Documentos"
                            >
                              <Eye size={12} />
                              <span>Analisar Docs</span>
                            </button>

                            <button
                              onClick={() => handleApprovePending(item.id, item.type, item.name)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Aprovar Cadastro"
                            >
                              <CheckCircle size={12} />
                              <span>Aprovar</span>
                            </button>

                            <button
                              onClick={() => handleRejectPending(item.id, item.type, item.name)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Rejeitar/Desaprovar Cadastro"
                            >
                              <XCircle size={12} />
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPendingItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">
                          <div className="max-w-xs mx-auto flex flex-col items-center">
                            <div className="p-4 bg-slate-50 text-slate-450 rounded-full mb-3">
                              <CheckCircle size={24} className="text-slate-300" />
                            </div>
                            <p className="text-slate-700 text-xs font-bold">Tudo em dia!</p>
                            <p className="text-slate-400 text-[11px] font-normal mt-1 leading-relaxed">
                              Nenhum cadastro pendente {pendingTypeFilter !== 'all' ? 'nesta categoria' : 'no sistema'}. Bom trabalho!
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL INSTANCES --- */}
      {selectedAdminToEdit && (
        <AdminEditModal 
          adminToEdit={selectedAdminToEdit}
          onClose={() => setSelectedAdminToEdit(null)}
          onSuccess={() => {}}
          currentAdminEmail={admin?.email || "Super Admin"}
        />
      )}

      {selectedDriverToEdit && (
        <DriverEditModal 
          driverToEdit={selectedDriverToEdit}
          onClose={() => setSelectedDriverToEdit(null)}
          onSuccess={() => {}}
          rides={ridesList}
          wallets={walletsList}
          currentAdminEmail={admin?.email || "Super Admin"}
        />
      )}

      {selectedCustomerToEdit && (
        <CustomerEditModal 
          customerToEdit={selectedCustomerToEdit}
          onClose={() => setSelectedCustomerToEdit(null)}
          onSuccess={() => {}}
          rides={ridesList}
          wallets={walletsList}
          currentAdminEmail={admin?.email || "Super Admin"}
        />
      )}

      {selectedCompanyToEdit && (
        <CompanyEditModal 
          companyToEdit={selectedCompanyToEdit}
          onClose={() => setSelectedCompanyToEdit(null)}
          onSuccess={() => {}}
          plans={plansList}
          rides={ridesList}
          currentAdminEmail={admin?.email || "Super Admin"}
        />
      )}

    </PageContainer>
  );
};
