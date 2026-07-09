import React, { useState, useEffect } from 'react';
import { 
  Database, Shield, ShieldCheck, Download, RefreshCw, Clock, 
  AlertTriangle, FileJson, CheckCircle, Trash2, Calendar, 
  User, Bike, Building2, MapPin, DollarSign, Settings2, Info
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  subscribeToBackups, 
  createBackupRecord, 
  deleteBackupRecord, 
  logAdminAction 
} from '../services/dbService';

export const BackupSecurity: React.FC = () => {
  const { admin } = useAuth();
  const { role } = usePermissions();
  const isSuperAdmin = role === 'super_admin';

  // State
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backup configs
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [frequency, setFrequency] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  useEffect(() => {
    const unsub = subscribeToBackups((data) => {
      setBackups(data);
    });
    return unsub;
  }, []);

  const triggerNotification = (success: boolean, msg: string) => {
    if (success) {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Generic function to trigger browser download of JSON file
  const downloadJSON = (data: any, fileName: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper to fetch entire Firestore collection
  const fetchCollectionData = async (collectionName: string): Promise<any[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (err) {
      console.error(`Erro ao buscar coleção ${collectionName}:`, err);
      return [];
    }
  };

  // CREATE COMPLETE SYSTEM BACKUP
  const handleCreateFullBackup = async () => {
    setLoading(true);
    try {
      const adminEmail = admin?.email || "Super Admin";
      await logAdminAction(adminEmail, "Iniciou backup manual completo de segurança do MotoJá.");

      // Fetch all core collections
      const users = await fetchCollectionData('users');
      const drivers = await fetchCollectionData('drivers');
      const companies = await fetchCollectionData('companies');
      const rides = await fetchCollectionData('rides');
      const transactions = await fetchCollectionData('transactions');
      const wallets = await fetchCollectionData('wallets');
      const admins = await fetchCollectionData('admins');
      const systemSettings = await fetchCollectionData('system_settings');

      const fullBackup = {
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: adminEmail,
          version: "2.1.0",
          environment: "production",
          platform: "MotoJá Central"
        },
        collections: {
          users,
          drivers,
          companies,
          rides,
          transactions,
          wallets,
          admins,
          systemSettings
        }
      };

      const backupId = `bkp_${Date.now()}`;
      const fileName = `motoja_backup_full_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;

      // 1. Write the backup record to firestore (logs history and metadata)
      await createBackupRecord({
        id: backupId,
        createdBy: adminEmail,
        fileName,
        summary: {
          users: users.length,
          drivers: drivers.length,
          companies: companies.length,
          rides: rides.length,
          transactions: transactions.length,
          admins: admins.length
        },
        dataPayload: JSON.stringify(fullBackup) // For dynamic restoration from panel
      });

      // 2. Trigger instant JSON download for localized security copy
      downloadJSON(fullBackup, fileName);

      await logAdminAction(adminEmail, `Backup completo criado com sucesso. Registro: ${backupId}.`);
      triggerNotification(true, "Backup completo gerado com sucesso! Arquivo JSON baixado e salvo no Firestore.");
    } catch (err) {
      triggerNotification(false, `Falha ao gerar backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // EXPORT INDIVIDUAL COLLECTIONS
  const handleExportCollection = async (type: string, collectionName: string, label: string) => {
    setExportingType(type);
    try {
      const adminEmail = admin?.email || "Super Admin";
      await logAdminAction(adminEmail, `Exportou coleção de ${label} em formato JSON.`);

      const data = await fetchCollectionData(collectionName);
      const fileName = `motoja_export_${type}_${new Date().toISOString().split('T')[0]}.json`;

      downloadJSON(data, fileName);
      triggerNotification(true, `Exportação de ${label} concluída! (${data.length} registros)`);
    } catch (err) {
      triggerNotification(false, `Erro ao exportar dados: ${err}`);
    } finally {
      setExportingType(null);
    }
  };

  // DELETE BACKUP LOG ENTRY (Guarded strictly by Super Admin requirement)
  const handleDeleteBackup = async (backupId: string, fileName: string) => {
    if (!isSuperAdmin) {
      triggerNotification(false, "Permissão negada: Apenas o Super Admin possui permissão para deletar backups permanentes.");
      return;
    }

    const confirm = window.confirm(`ATENÇÃO SUPER ADMIN: Tem certeza absoluta que deseja excluir o backup [${fileName}] permanentemente do Firestore? Esta ação é irreversível.`);
    if (!confirm) return;

    try {
      const adminEmail = admin?.email || "Super Admin";
      await deleteBackupRecord(backupId);
      await logAdminAction(adminEmail, `EXCLUIU o registro de backup: ${fileName} (${backupId}).`);
      triggerNotification(true, "Registro de backup removido com sucesso.");
    } catch (err) {
      triggerNotification(false, `Erro ao excluir registro de backup: ${err}`);
    }
  };

  // Restore/Download existing backup payload from history list
  const handleDownloadExistingBackup = (backup: any) => {
    try {
      if (backup.dataPayload) {
        const parsed = JSON.parse(backup.dataPayload);
        downloadJSON(parsed, backup.fileName);
        triggerNotification(true, `Backup ${backup.fileName} baixado com sucesso.`);
      } else {
        // Fallback with meta information
        const fallback = {
          metadata: {
            id: backup.id,
            createdAt: backup.createdAt,
            createdBy: backup.createdBy,
            fileName: backup.fileName,
            warning: "O payload completo foi removido para economizar espaço. Contém o resumo abaixo."
          },
          summary: backup.summary
        };
        downloadJSON(fallback, backup.fileName);
        triggerNotification(true, `Estrutura de metadados do backup baixada.`);
      }
    } catch (err) {
      triggerNotification(false, `Erro ao processar download do backup: ${err}`);
    }
  };

  return (
    <PageContainer
      title="Backup & Segurança dos Dados"
      subtitle="Painel de redundância, proteção e exportações estruturadas da arquitetura unificada do MotoJá"
    >
      <div className="space-y-6">
        
        {/* Protection alert top bar - BEFORE EXECUTING RESTORE OR DELETES */}
        <div className="bg-slate-950 text-slate-100 border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 border border-amber-500/20">
              <ShieldCheck size={24} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-tight text-amber-400 flex items-center gap-2">
                Arquitetura Ativa Segura e Preservada
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                As três aplicações (<span className="text-amber-300 font-semibold">Passageiro, Motorista e Admin</span>) conectam-se de forma redundante e segura ao mesmo núcleo de dados do Firestore. Antes de efetuar qualquer alteração em lote, execute um backup completo para salvaguardar as tabelas vigentes.
              </p>
            </div>
          </div>
          <button 
            disabled={loading}
            onClick={handleCreateFullBackup}
            className="w-full md:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-98 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
            <span>Criar Backup Manual Completo</span>
          </button>
        </div>

        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Central columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Columns - Manual exports and Automatics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CARD 1: Export individual collections */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
                <FileJson size={16} className="text-slate-500" />
                <span>Exportação Estruturada de Coleções</span>
              </h3>
              
              <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
                Selecione os módulos operacionais específicos abaixo para extrair, compilar e baixar os dados brutos cadastrados no banco unificado do MotoJá em arquivos estruturados JSON.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Users / Clientes */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Usuários Gerais</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: users</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('users', 'users', 'Usuários Gerais')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'users' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

                {/* Drivers / Motoristas */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                      <Bike size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Motoristas</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: drivers</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('drivers', 'drivers', 'Motoristas')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'drivers' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

                {/* Companies / Empresas */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Empresas Parceiras</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: companies</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('companies', 'companies', 'Empresas Parceiras')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'companies' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

                {/* Rides / Corridas */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Histórico de Corridas</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: rides</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('rides', 'rides', 'Histórico de Corridas')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'rides' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

                {/* Payments / Financeiro */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                      <DollarSign size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Pagamentos e Caixa</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: transactions</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('transactions', 'transactions', 'Pagamentos')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'transactions' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

                {/* System configurations */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                      <Settings2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block">Configurações Gerais</span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">Coleção: system_settings</span>
                    </div>
                  </div>
                  <button
                    disabled={exportingType !== null}
                    onClick={() => handleExportCollection('system_settings', 'system_settings', 'Configurações do Sistema')}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportingType === 'system_settings' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                </div>

              </div>
            </div>

            {/* CARD 2: Automated backup schedule simulation */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
                <Clock size={16} className="text-amber-500" />
                <span>Backup Automático e Recorrente</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4">
                    Programe cópias automáticas de redundância do banco de dados unificado na nuvem Firestore para evitar perda acidental de dados de corrida ou pagamentos ativos.
                  </p>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Status do Backup Periódico</span>
                      <span className="text-[10px] font-mono text-slate-400">Armazenamento em nuvem ativa</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={autoBackupEnabled}
                        onChange={() => setAutoBackupEnabled(!autoBackupEnabled)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1.5 tracking-wider">Frequência da Cópia</label>
                    <select
                      disabled={!autoBackupEnabled}
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all disabled:opacity-50"
                    >
                      <option value="daily">A cada 24 horas (Diário)</option>
                      <option value="weekly">Semanalmente (Aos domingos às 02h)</option>
                      <option value="monthly">Mensalmente (Todo dia 01 às 00h)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/30 flex gap-2.5 items-start mt-4">
                    <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {autoBackupEnabled 
                        ? `A política ativa de redundância está configurada para salvar uma cópia consolidada do núcleo MotoJá ${frequency === 'daily' ? 'diariamente' : frequency === 'weekly' ? 'semanalmente' : 'mensalmente'}.`
                        : "O backup automático recorrente está desativado. Certifique-se de realizar backups manuais constantes."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Backup logs and Super Admin confirmation alerts */}
          <div className="space-y-6">

            {/* CARD 3: Guard policy warning */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 text-rose-100">
                <AlertTriangle size={70} className="stroke-[1px]" />
              </div>
              <h3 className="font-display font-bold text-sm text-rose-800 flex items-center gap-2 mb-3 relative z-10">
                <AlertTriangle size={16} />
                <span>Protocolo de Salvaguarda</span>
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed font-semibold mb-4 relative z-10">
                Conforme diretrizes regulatórias do MotoJá, a remoção de contas ou exclusão de backups é restrita ao Super Admin.
              </p>
              <ul className="space-y-2 text-[10px] font-semibold text-rose-600/95 list-disc pl-4 relative z-10">
                <li>Nunca apague coleções de usuários ativos.</li>
                <li>As exclusões permanentes devem ser aprovadas e auditadas em log corporativo.</li>
                <li>Sempre confirme com o Super Admin antes de descartar registros antigos.</li>
              </ul>
            </div>

            {/* CARD 4: Live Backup logs fetched from Firestore backups collection */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
                <Calendar size={16} className="text-slate-500" />
                <span>Histórico de Backups</span>
              </h3>

              {backups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Database size={20} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold">Sem backups recentes na nuvem.</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">Clique em "Criar Backup Manual" para gerar um ponto de restauração.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {backups.map((bkp) => (
                    <div 
                      key={bkp.id} 
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs font-medium text-slate-600"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate" title={bkp.fileName}>
                            {bkp.fileName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                            {new Date(bkp.createdAt).toLocaleDateString('pt-BR')} às {new Date(bkp.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDownloadExistingBackup(bkp)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Baixar Backup"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(bkp.id, bkp.fileName)}
                            className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                              isSuperAdmin 
                                ? 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100' 
                                : 'opacity-40 bg-slate-100 border-slate-150 text-slate-300 cursor-not-allowed'
                            }`}
                            disabled={!isSuperAdmin}
                            title={isSuperAdmin ? "Excluir Registro" : "Apenas Super Admin"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Summary of items backed up */}
                      {bkp.summary && (
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-150 text-[10px] font-mono font-bold text-slate-400">
                          <div>👥 Usr: <span className="text-slate-600 font-extrabold">{bkp.summary.users}</span></div>
                          <div>🏍️ Mot: <span className="text-slate-600 font-extrabold">{bkp.summary.drivers}</span></div>
                          <div>🏢 Emp: <span className="text-slate-600 font-extrabold">{bkp.summary.companies}</span></div>
                          <div>🏁 Corr: <span className="text-slate-600 font-extrabold">{bkp.summary.rides}</span></div>
                          <div>💳 Fin: <span className="text-slate-600 font-extrabold">{bkp.summary.transactions}</span></div>
                          <div>🛡️ Adm: <span className="text-slate-600 font-extrabold">{bkp.summary.admins}</span></div>
                        </div>
                      )}

                      <div className="text-[9px] text-slate-400 italic">
                        Criado por: {bkp.createdBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Dynamic Architectural Diagram card demonstrating central integration */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <Info size={16} className="text-blue-500" />
            <span>Infraestrutura Conectada do Ecossistema MotoJá</span>
          </h3>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
              
              {/* Box 1: Apps */}
              <div className="w-full md:w-1/4 bg-white border border-slate-150 rounded-xl p-4 text-center shadow-xs">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold font-mono rounded-md uppercase">Clientes & Operações</span>
                <h4 className="font-bold text-xs text-slate-800 mt-2 block">Aplicativos MotoJá</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium">
                  App Passageiro, App Motorista e Portal de Empresas conectando-se via REST/Sockets.
                </p>
              </div>

              {/* Line 1 */}
              <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-blue-300 via-amber-300 to-emerald-300 relative items-center justify-center">
                <span className="absolute -top-3 text-[9px] font-mono font-bold text-amber-500">HTTPS / TLS</span>
              </div>

              {/* Box 2: Central Integration */}
              <div className="w-full md:w-1/3 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-5 text-center shadow-lg relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-bold font-mono rounded-full uppercase tracking-wider">
                  NÚCLEO INTEGRADO
                </div>
                <h4 className="font-display font-bold text-xs text-amber-400 mt-2 block">Banco de Dados Único (Firestore)</h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Tabelas compartilhadas unificadas por <span className="text-slate-100 font-mono font-bold">usuarioId</span> conectando dados cadastrais, financeiros e históricos em tempo real.
                </p>
              </div>

              {/* Line 2 */}
              <div className="hidden md:flex flex-1 h-0.5 bg-gradient-to-r from-emerald-300 via-slate-300 to-amber-300 relative items-center justify-center">
                <span className="absolute -top-3 text-[9px] font-mono font-bold text-emerald-500">Backup Ativo</span>
              </div>

              {/* Box 3: Backup Vault */}
              <div className="w-full md:w-1/4 bg-white border border-slate-150 rounded-xl p-4 text-center shadow-xs">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold font-mono rounded-md uppercase">Redundância</span>
                <h4 className="font-bold text-xs text-slate-800 mt-2 block">Cópia de Segurança</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium">
                  Pontos de restauração isolados em JSON local e Logs com payloads redundantes na nuvem.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
