import React, { useState } from 'react';
import { X, Building2, Mail, Phone, Lock, Check, RefreshCw, ClipboardList, CreditCard, DollarSign, UserPlus, Users, Eye, Play, Trash2 } from 'lucide-react';
import { Company, CompanyPlan, Employee, Ride } from '../types';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { updateCompany, logAdminAction } from '../services/dbService';

interface CompanyEditModalProps {
  companyToEdit: Company;
  onClose: () => void;
  onSuccess: () => void;
  plans: CompanyPlan[];
  rides: Ride[];
  currentAdminEmail: string;
}

export const CompanyEditModal: React.FC<CompanyEditModalProps> = ({
  companyToEdit,
  onClose,
  onSuccess,
  plans,
  rides,
  currentAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'finance' | 'employees' | 'rides'>('info');

  // Company details
  const [companyName, setCompanyName] = useState(companyToEdit.companyName);
  const [tradingName, setTradingName] = useState(companyToEdit.tradingName);
  const [cnpj, setCnpj] = useState(companyToEdit.cnpj);
  const [stateRegistration, setStateRegistration] = useState(companyToEdit.stateRegistration || '');
  const [corporateEmail, setCorporateEmail] = useState(companyToEdit.corporateEmail);
  const [phone, setPhone] = useState(companyToEdit.phone);
  const [address, setAddress] = useState(companyToEdit.address || '');
  const [logoUrl, setLogoUrl] = useState(companyToEdit.logoUrl || '');
  const [cnpjPhotoUrl, setCnpjPhotoUrl] = useState((companyToEdit as any).cnpjPhotoUrl || '');
  const [contractPhotoUrl, setContractPhotoUrl] = useState((companyToEdit as any).contractPhotoUrl || '');
  const [responsibleName, setResponsibleName] = useState(companyToEdit.responsibleName);
  const [responsibleRole, setResponsibleRole] = useState(companyToEdit.responsibleRole);

  // Administrative / Account login details
  const [adminName, setAdminName] = useState(companyToEdit.adminName);
  const [adminEmail, setAdminEmail] = useState(companyToEdit.adminEmail);
  const [adminPhone, setAdminPhone] = useState(companyToEdit.adminPhone);
  const [adminPassword, setAdminPassword] = useState('');

  // Plan and Financial details
  const [planId, setPlanId] = useState(companyToEdit.planId);
  const [status, setStatus] = useState(companyToEdit.status);
  const [monthlyLimit, setMonthlyLimit] = useState(companyToEdit.monthlyLimit);
  const [spentThisMonth, setSpentThisMonth] = useState(companyToEdit.spentThisMonth || 0);
  const [specialRatePerKm, setSpecialRatePerKm] = useState(companyToEdit.specialRatePerKm || 0);

  // Employees Sub-list
  const [employees, setEmployees] = useState<Employee[]>(companyToEdit.employees || []);
  
  // New employee form states
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activePlan = plans.find(p => p.id === planId) || { name: 'Personalizado', employeeLimit: 50 };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData: Partial<Company> = {
        companyName,
        tradingName,
        cnpj,
        stateRegistration,
        corporateEmail,
        phone,
        address,
        logoUrl,
        cnpjPhotoUrl,
        contractPhotoUrl,
        responsibleName,
        responsibleRole,
        adminName,
        adminEmail,
        adminPhone,
        planId,
        status,
        monthlyLimit: Number(monthlyLimit),
        spentThisMonth: Number(spentThisMonth),
        specialRatePerKm: Number(specialRatePerKm),
        employees
      };

      if (adminPassword.trim()) {
        (updateData as any).adminPassword = adminPassword.trim();
      }

      await updateCompany(companyToEdit.id, updateData);

      const logDesc = `Editou empresa parceira ${tradingName} (${cnpj}). Plano: ${planId}. Limite: R$ ${monthlyLimit}`;
      await logAdminAction(currentAdminEmail, logDesc);

      setSuccessMsg('Ficha corporativa atualizada com sucesso!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar alterações da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (employees.length >= activePlan.employeeLimit) {
      setErrorMsg(`O plano atual (${activePlan.name}) permite no máximo ${activePlan.employeeLimit} funcionários. Faça o upgrade do plano para adicionar mais.`);
      return;
    }

    if (!empName.trim() || !empEmail.trim() || !empPhone.trim()) {
      setErrorMsg('Informe todos os dados do funcionário.');
      return;
    }

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: empName.trim(),
      email: empEmail.trim(),
      phone: empPhone.trim(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedEmployees = [...employees, newEmp];
    setEmployees(updatedEmployees);
    
    // Clear form fields
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');

    setSuccessMsg('Funcionário incluído na listagem corporativa local! Clique em "Salvar Empresa" para consolidar.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveEmployee = (empId: string) => {
    const updated = employees.filter(e => e.id !== empId);
    setEmployees(updated);
    setSuccessMsg('Funcionário removido! Lembre-se de salvar as alterações da empresa para consolidar.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleToggleEmployeeStatus = (empId: string) => {
    const updated = employees.map(e => {
      if (e.id === empId) {
        return { ...e, status: e.status === 'active' ? 'blocked' as const : 'active' as const };
      }
      return e;
    });
    setEmployees(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Ficha da Empresa Parceira</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-0.5">CNPJ: {cnpj} | ID: {companyToEdit.id}</p>
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
            Dados Cadastrais
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'finance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Plano & Faturamento
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'employees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Funcionários ({employees.length})
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse">
              <Check size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: COMPANY DATA */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="pb-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-wider">Dados da Pessoa Jurídica (PJ)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Razão Social</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="Isento ou Nº"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Telefone Corporativo</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email de Contato Comercial</label>
                  <input
                    type="email"
                    required
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço da Sede</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="sm:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                  <ImageUpload
                    label="Logotipo da Empresa"
                    value={logoUrl}
                    onChange={(base64) => setLogoUrl(base64)}
                    onClear={() => setLogoUrl('')}
                    type="avatar"
                    id="edit-company-logo"
                  />
                  <ImageUpload
                    label="Contrato Social / Estatuto"
                    value={contractPhotoUrl}
                    onChange={(base64) => setContractPhotoUrl(base64)}
                    onClear={() => setContractPhotoUrl('')}
                    type="document"
                    id="edit-company-contract"
                  />
                  <ImageUpload
                    label="Comprovante de CNPJ"
                    value={cnpjPhotoUrl}
                    onChange={(base64) => setCnpjPhotoUrl(base64)}
                    onClear={() => setCnpjPhotoUrl('')}
                    type="document"
                    id="edit-company-cnpj"
                  />
                </div>
              </div>

              <div className="pb-1.5 border-b border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-wider">Responsável pelo Contrato</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Gestor Responsável</label>
                  <input
                    type="text"
                    required
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo / Setor</label>
                  <input
                    type="text"
                    required
                    value={responsibleRole}
                    onChange={(e) => setResponsibleRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="pb-1.5 border-b border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-blue-500 uppercase font-mono tracking-wider">Conta de Login Administrativo da Empresa</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Operador Empresa</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email de Login Empresa</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Redefinir Senha Login (Opcional)</label>
                  <input
                    type="password"
                    placeholder="Min. 6 dígitos"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: PLANS & FINANCIAL */}
          {activeTab === 'finance' && (
            <div className="space-y-5">
              <div className="pb-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold text-emerald-500 uppercase font-mono tracking-wider">Plano Corporativo & Faturamento Mensal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Plano Ativo</label>
                  <select
                    value={planId}
                    onChange={(e: any) => setPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="basic">Plano Básico corporativo</option>
                    <option value="corporate">Plano Empresarial corporativo</option>
                    <option value="premium">Plano Premium corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status da Parceria</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="active">Parceria Ativa (Liberada)</option>
                    <option value="blocked">Parceria Bloqueada (Inadimplência/Suspensão)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Limite de Utilização Mensal (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      required
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gastos Consolidados no Mês (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      required
                      value={spentThisMonth}
                      onChange={(e) => setSpentThisMonth(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Taxa Especial por Km (Opcional - R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={specialRatePerKm}
                      onChange={(e) => setSpecialRatePerKm(Number(e.target.value))}
                      placeholder="Ex: 1.80"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Deixe 0 para utilizar a taxa padrão definida pelo plano.</p>
                </div>
              </div>

              {/* Spend tracker progress bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Acompanhamento do Limite Mensal</span>
                  <span className="text-slate-800">R$ {spentThisMonth.toFixed(2)} de R$ {monthlyLimit.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (spentThisMonth / (monthlyLimit || 1)) >= 0.9 ? 'bg-rose-500' :
                      (spentThisMonth / (monthlyLimit || 1)) >= 0.7 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (spentThisMonth / (monthlyLimit || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[9.5px] text-slate-400">Quando a empresa atinge o limite de faturamento, as corridas de seus funcionários cadastrados serão preventivamente recusadas pelo aplicativo.</p>
              </div>
            </div>
          )}

          {/* TAB 3: LINKED EMPLOYEES LIST */}
          {activeTab === 'employees' && (
            <div className="space-y-5">
              <div className="pb-1.5 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-500 uppercase font-mono tracking-wider">Cadastro de Funcionários Autorizados</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Limite do Plano: {employees.length}/{activePlan.employeeLimit}</span>
              </div>

              {/* Add employee form */}
              <form onSubmit={handleAddEmployee} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="João Souza"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Email Corporativo</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="joao@empresa.com"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Celular / Ramal</label>
                    <input
                      type="text"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      placeholder="(11) 97777-7777"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm" className="bg-slate-900 text-amber-400 shrink-0 h-9">
                    <UserPlus size={14} />
                  </Button>
                </div>
              </form>

              {/* Employees List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Funcionários com Cota de Viagem</span>
                {employees.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                    Nenhum funcionário cadastrado nesta empresa corporativa.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {employees.map((emp) => (
                      <div key={emp.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                        <div>
                          <div className="text-slate-800 font-bold">{emp.name}</div>
                          <span className="text-[9.5px] text-slate-400 block font-mono mt-0.5">
                            Email: {emp.email} | Tel: {emp.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleEmployeeStatus(emp.id)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                              emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {emp.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(emp.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading} className="bg-amber-400 hover:bg-amber-500 text-slate-950">
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Gravando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Salvar Empresa</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
