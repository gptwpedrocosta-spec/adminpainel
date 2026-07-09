import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, Bike, Layers, Trash2, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sendPushNotification } from '../services/dbService';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  target: string;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'drivers' | 'users'>('all');
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Subscribe to notification log in Firestore to show audit history
  useEffect(() => {
    const q = query(collection(db, 'notifications_log'), orderBy('createdAt', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedLogs: NotificationLog[] = [];
      snapshot.forEach((doc) => {
        parsedLogs.push({ id: doc.id, ...doc.data() } as NotificationLog);
      });
      setLogs(parsedLogs);
    }, (err) => {
      console.error("Erro ao buscar histórico de notificações:", err);
    });

    return unsubscribe;
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setSendSuccess(false);

    try {
      await sendPushNotification(title, body, target);
      setTitle('');
      setBody('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      alert("Erro ao disparar notificação: " + err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm("Excluir registro de auditoria da notificação?")) {
      try {
        await deleteDoc(doc(db, 'notifications_log', logId));
      } catch (err) {
        alert("Erro ao deletar: " + err);
      }
    }
  };

  return (
    <PageContainer 
      title="Central de Notificações" 
      subtitle="Envio de alertas instantâneos via push (FCM) e comunicados para motoristas e passageiros"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Compose Notification panel */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-5">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Disparador de Alertas</span>
            <h3 className="font-display font-bold text-slate-800 text-sm">Compor Push Notification</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Segmento de Destino</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    target === 'all' 
                      ? 'border-amber-400 bg-amber-50/25 text-slate-900 font-bold' 
                      : 'border-slate-150 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={16} />
                  <span>Todos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('drivers')}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    target === 'drivers' 
                      ? 'border-amber-400 bg-amber-50/25 text-slate-900 font-bold' 
                      : 'border-slate-150 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bike size={16} />
                  <span>Pilotos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('users')}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    target === 'users' 
                      ? 'border-amber-400 bg-amber-50/25 text-slate-900 font-bold' 
                      : 'border-slate-150 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users size={16} />
                  <span>Clientes</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1 font-bold">Título do Alerta</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tarifa Dinâmica Ativa!" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1 font-bold">Mensagem do Push</label>
              <textarea 
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Digite o texto explicativo do alerta que aparecerá na tela do celular do usuário..." 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Alert Success Banner */}
            {sendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold animate-in fade-in duration-200">
                <CheckCircle size={14} />
                <span>Notificação enviada e registrada com sucesso!</span>
              </div>
            )}

            {/* Send Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSending || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>{isSending ? 'Disparando...' : 'Disparar Push Notification'}</span>
            </Button>
          </form>
        </div>

        {/* Audit History Log table (2/3 col) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800 text-sm">Histórico de Alertas (FCM Log)</h3>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Auditoria</span>
          </div>

          <div className="overflow-x-auto">
            {logs.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <Bell size={24} className="text-slate-300 mb-2 shrink-0" />
                <p className="text-xs font-semibold">Nenhum push enviado ainda.</p>
                <p className="text-[10px] font-mono mt-1">Envie sua primeira mensagem utilizando o painel lateral.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Destinatário</th>
                    <th className="py-3 px-5">Título / Mensagem</th>
                    <th className="py-3 px-5">Data Envio</th>
                    <th className="py-3 px-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/20 transition-colors font-semibold">
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-sm uppercase tracking-wider ${
                          log.target === 'all' ? 'bg-amber-100 text-amber-700' :
                          log.target === 'drivers' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {log.target === 'all' ? 'TODOS' :
                           log.target === 'drivers' ? 'PILOTOS' : 'CLIENTES'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 max-w-sm">
                        <span className="font-bold text-slate-800 block truncate leading-none">{log.title}</span>
                        <span className="text-slate-500 text-[11px] block mt-1.5 leading-relaxed truncate font-medium" title={log.body}>{log.body}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Deletar Registro"
                        >
                          <Trash2 size={14} />
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
    </PageContainer>
  );
};
