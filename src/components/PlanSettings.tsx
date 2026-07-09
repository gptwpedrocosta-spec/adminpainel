import React, { useState } from 'react';
import { Award, DollarSign, Percent, Settings, Check, RefreshCw, Edit3 } from 'lucide-react';
import { CompanyPlan } from '../types';
import { Button } from './Button';
import { savePlan, logAdminAction } from '../services/dbService';

interface PlanSettingsProps {
  plans: CompanyPlan[];
  onSuccess: () => void;
  currentAdminEmail: string;
}

export const PlanSettings: React.FC<PlanSettingsProps> = ({
  plans,
  onSuccess,
  currentAdminEmail
}) => {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Editing values
  const [name, setName] = useState('');
  const [monthlyValue, setMonthlyValue] = useState(0);
  const [rideLimit, setRideLimit] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customRatePerKm, setCustomRatePerKm] = useState(0);
  const [employeeLimit, setEmployeeLimit] = useState(0);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleStartEdit = (plan: CompanyPlan) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setMonthlyValue(plan.monthlyValue);
    setRideLimit(plan.rideLimit);
    setDiscountPercent(plan.discountPercent);
    setCustomRatePerKm(plan.customRatePerKm);
    setEmployeeLimit(plan.employeeLimit);
  };

  const handleSave = async (e: React.FormEvent, planId: string) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const updatedPlan: CompanyPlan = {
        id: planId,
        name,
        monthlyValue: Number(monthlyValue),
        rideLimit: Number(rideLimit),
        discountPercent: Number(discountPercent),
        customRatePerKm: Number(customRatePerKm),
        employeeLimit: Number(employeeLimit)
      };

      await savePlan(updatedPlan);

      const logDesc = `Editou configurações do Plano Corporativo ${name} (${planId}). Valor: R$ ${monthlyValue}. Desc: ${discountPercent}%`;
      await logAdminAction(currentAdminEmail, logDesc);

      setSuccessMsg(`Plano ${name} atualizado com sucesso no Firestore!`);
      setEditingPlanId(null);
      onSuccess();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar plano corporativo no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <Settings size={16} />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-800 text-sm">Painel de Configuração de Planos Empresariais</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase font-mono mt-0.5">Defina tarifas personalizadas, cota de funcionários e limite de corridas do B2B corporativo</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plans grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlanId === plan.id;

          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-2xl border transition-all relative overflow-hidden ${
                isEditing ? 'border-amber-400 shadow-lg' : 'border-slate-150 shadow-xs hover:shadow-md'
              }`}
            >
              {/* Premium flag style top decor */}
              <div className={`h-1.5 w-full ${
                plan.id === 'premium' ? 'bg-indigo-600' :
                plan.id === 'corporate' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />

              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">{plan.id}</span>
                    <h4 className="font-display font-bold text-slate-800 text-base mt-0.5">{plan.name}</h4>
                  </div>
                  <div className={`p-2 rounded-xl text-xs font-bold ${
                    plan.id === 'premium' ? 'bg-indigo-50 text-indigo-600' :
                    plan.id === 'corporate' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    <Award size={16} />
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={(e) => handleSave(e, plan.id)} className="space-y-4 pt-1">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome do Plano</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Preço Mensal (R$)</label>
                        <input
                          type="number"
                          required
                          value={monthlyValue}
                          onChange={(e) => setMonthlyValue(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Limite Corridas/Mês</label>
                        <input
                          type="number"
                          required
                          value={rideLimit}
                          onChange={(e) => setRideLimit(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Desconto (%)</label>
                        <input
                          type="number"
                          required
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tarifa p/ Km (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={customRatePerKm}
                          onChange={(e) => setCustomRatePerKm(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Limite Funcionários p/ Empresa</label>
                      <input
                        type="number"
                        required
                        value={employeeLimit}
                        onChange={(e) => setEmployeeLimit(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingPlanId(null)}
                        className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {loading ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>Salvar</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 pt-1 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase block">Custo Mensal Fixado</span>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">R$ {plan.monthlyValue.toFixed(2)}</div>
                    </div>

                    <div className="divide-y divide-slate-100 font-semibold text-slate-600">
                      <div className="py-2.5 flex justify-between">
                        <span>Limite de Corridas Mensais</span>
                        <span className="text-slate-800 font-extrabold">{plan.rideLimit} un</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span>Desconto sobre Tarifas</span>
                        <span className="text-emerald-600 font-extrabold">{plan.discountPercent}% OFF</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span>Tarifa Fixada por Km</span>
                        <span className="text-slate-800 font-extrabold">R$ {plan.customRatePerKm.toFixed(2)}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span>Capacidade de Funcionários</span>
                        <span className="text-slate-800 font-extrabold">{plan.employeeLimit} slots</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center text-slate-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl mt-3"
                      icon={<Edit3 size={13} />}
                      onClick={() => handleStartEdit(plan)}
                    >
                      Ajustar Plano
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
