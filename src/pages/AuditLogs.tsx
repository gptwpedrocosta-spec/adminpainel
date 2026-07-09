import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { subscribeToAuditLogs } from '../services/dbService';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAuditLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredLogs = logs.filter((log) => {
    return (
      (log.adminEmail && log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.actionDescription && log.actionDescription.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <PageContainer
      title="Logs de Auditoria e Conformidade"
      subtitle="Ficha de auditoria centralizada registrando ações, alterações tarifárias e decisões operacionais efetuadas pela equipe staff"
    >
      <div className="space-y-6">
        {/* Search and counters */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por email, ação, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Total registrado: {filteredLogs.length} eventos de auditoria
          </span>
        </div>

        {/* Ledger view */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw size={24} className="animate-spin text-amber-500 mb-2" />
              <p className="text-xs font-semibold">Carregando trilhas de auditoria...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Nenhuma ação registrada nos logs.</p>
              <p className="text-[10px] font-mono mt-1">Todas as mutações realizadas por administradores serão logadas de forma auditável.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">Data & Hora</th>
                    <th className="py-3.5 px-6">Administrador Responsável</th>
                    <th className="py-3.5 px-6">Ação Efetuada / Detalhes</th>
                    <th className="py-3.5 px-6 text-right">Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredLogs.map((log) => {
                    const dateObj = new Date(log.createdAt);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-slate-400 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-300" />
                            <span>{formattedDate} {formattedTime}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          {log.adminEmail}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 max-w-xl leading-relaxed">
                          {log.actionDescription}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-[10px] font-bold text-slate-400 uppercase">
                          Firestore
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
