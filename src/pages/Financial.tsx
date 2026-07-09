import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, AlertCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Wallet, Transaction } from '../types';
import { PageContainer } from '../components/PageContainer';

interface FinancialProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

export const Financial: React.FC<FinancialProps> = ({ wallets, transactions }) => {
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Platform wallet balance
  const platformWallet = wallets.find(w => w.id === 'platform');
  const platformBalance = platformWallet ? platformWallet.balance : 0;

  // Drivers aggregate wallet balance
  const driversBalance = wallets
    .filter(w => w.type === 'driver')
    .reduce((acc, curr) => acc + curr.balance, 0);

  // Customers aggregate wallet balance
  const customersBalance = wallets
    .filter(w => w.type === 'customer')
    .reduce((acc, curr) => acc + curr.balance, 0);

  // Filter transaction history
  const filteredTxs = transactions.filter((tx) => {
    if (txTypeFilter === 'all') return true;
    return tx.type === txTypeFilter;
  });

  // Recharts Chart Data (simulated monthly platform growth)
  const monthlyRevenueData = [
    { month: 'Jan', faturamento: 4500, comissoes: 900 },
    { month: 'Fev', faturamento: 5800, comissoes: 1160 },
    { month: 'Mar', faturamento: 6200, comissoes: 1240 },
    { month: 'Abr', faturamento: 7100, comissoes: 1420 },
    { month: 'Mai', faturamento: 8900, comissoes: 1780 },
    { month: 'Jun', faturamento: 11200, comissoes: 2240 },
    { month: 'Jul', faturamento: 14850, comissoes: 2970 },
  ];

  return (
    <PageContainer 
      title="Demonstrativo Financeiro" 
      subtitle="Balancete geral de repasses, taxas administrativas e controle de transações da rede MotoJá"
    >
      <div className="space-y-6">
        {/* Cards aggregate banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Platform wallet */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-5 rounded-2xl shadow-md shadow-amber-500/10 flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider opacity-80">Caixa Plataforma (MotoJá)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-950/10 flex items-center justify-center border border-white/20">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <h2 className="font-display font-black text-3xl tracking-tight leading-none">R$ {platformBalance.toFixed(2)}</h2>
              <p className="text-[10px] font-semibold font-mono opacity-80 mt-2">Faturamento líquido acumulado (20%)</p>
            </div>
          </div>

          {/* Drivers Wallet */}
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Custódia Condutores</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl tracking-tight text-slate-850">R$ {driversBalance.toFixed(2)}</h2>
              <p className="text-[10px] font-mono text-slate-400 mt-2">Saldo total consolidado a repassar aos pilotos</p>
            </div>
          </div>

          {/* Customers balance */}
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Depósitos Clientes</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl tracking-tight text-slate-850">R$ {customersBalance.toFixed(2)}</h2>
              <p className="text-[10px] font-mono text-slate-400 mt-2">Créditos ativos em carteiras digitais integradas</p>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart & Ledger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart (2/3 col) */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div className="mb-4">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Desempenho de Crescimento</span>
              <h3 className="font-display font-bold text-slate-800 text-sm">Histórico Consolidado de Receita</h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '12px' }}
                  />
                  <Legend style={{ fontSize: '12px' }} />
                  <Bar dataKey="faturamento" name="Bruto Geral (R$)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comissoes" name="Retenções Líquidas (R$)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions log (1/3 col) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm">Extrato de Caixa</h3>
              
              {/* Filter */}
              <div className="flex gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setTxTypeFilter('all')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${txTypeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'}`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setTxTypeFilter('credit')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${txTypeFilter === 'credit' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400'}`}
                >
                  Créditos
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {filteredTxs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                  <AlertCircle size={20} className="text-slate-300 mb-1 shrink-0" />
                  <p className="text-xs font-semibold">Sem transações registradas.</p>
                  <p className="text-[9px] font-mono mt-0.5">Realize uma simulação de corrida.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTxs.map((tx) => (
                    <div key={tx.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          tx.type === 'credit' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {tx.type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-700 block truncate leading-tight" title={tx.description}>
                            {tx.description}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
