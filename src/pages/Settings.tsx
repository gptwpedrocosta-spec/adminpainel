import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Shield, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { usePermissions } from '../hooks/usePermissions';

export const Settings: React.FC = () => {
  const { hasAccess } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Configuration States
  const [baseFare, setBaseFare] = useState(5.00);
  const [pricePerKm, setPricePerKm] = useState(2.00);
  const [platformFeePercent, setPlatformFeePercent] = useState(20);
  const [minimumFare, setMinimumFare] = useState(8.00);
  const [dynamicMultiplier, setDynamicMultiplier] = useState(1.0);
  const [cityBoundaries, setCityBoundaries] = useState('São Paulo - SP (Metropolitana)');

  // Load from Firestore or fallback to default
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const configRef = doc(db, 'system_settings', 'config');
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.baseFare !== undefined) setBaseFare(data.baseFare);
          if (data.pricePerKm !== undefined) setPricePerKm(data.pricePerKm);
          if (data.platformFeePercent !== undefined) setPlatformFeePercent(data.platformFeePercent);
          if (data.minimumFare !== undefined) setMinimumFare(data.minimumFare);
          if (data.dynamicMultiplier !== undefined) setDynamicMultiplier(data.dynamicMultiplier);
          if (data.cityBoundaries !== undefined) setCityBoundaries(data.cityBoundaries);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do Firestore: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess('settings')) {
      alert("Seu perfil de acesso não possui permissão para salvar configurações do sistema.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const configRef = doc(db, 'system_settings', 'config');
      await setDoc(configRef, {
        baseFare,
        pricePerKm,
        platformFeePercent,
        minimumFare,
        dynamicMultiplier,
        cityBoundaries,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Erro ao gravar novas diretrizes no Firestore: " + err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Configurações do Sistema" subtitle="Buscando diretivas tarifárias no Firestore...">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
          <RefreshCw size={28} className="animate-spin text-amber-500 mb-2" />
          <p className="text-xs font-semibold">Carregando tabelas e parâmetros de tarifas...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Configurações Gerais" 
      subtitle="Definição de parâmetros operacionais, regras tarifárias, taxas de intermediação e limites de atuação geográfica"
    >
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Core Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tariffs and Pricing Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <SettingsIcon size={16} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Diretrizes de Precificação</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono mt-0.5">Defina tarifas base para cálculo automático</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Base Fare */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tarifa de Partida (Base)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={baseFare}
                    onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
                    placeholder="5.00" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Price Per Km */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tarifa por Quilômetro (Km)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                    placeholder="2.00" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Minimum Fare */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tarifa Mínima da Viagem</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={minimumFare}
                    onChange={(e) => setMinimumFare(parseFloat(e.target.value) || 0)}
                    placeholder="8.00" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Dynamic pricing multiplier */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tarifa Dinâmica (Multiplicador)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">x</span>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={dynamicMultiplier}
                    onChange={(e) => setDynamicMultiplier(parseFloat(e.target.value) || 1.0)}
                    placeholder="1.0" 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Boundaries and Fees */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Diretrizes de Custódia e Operações</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono mt-0.5">Gerenciamento de taxas de intermediação e área de cobertura</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Platform Fee Percent */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Taxa de Intermediação (Comissão)</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="50"
                    value={platformFeePercent}
                    onChange={(e) => setPlatformFeePercent(parseInt(e.target.value) || 0)}
                    placeholder="20" 
                    className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* City coverage */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Zona Ativa de Atuação</label>
                <input 
                  type="text" 
                  required
                  value={cityBoundaries}
                  onChange={(e) => setCityBoundaries(e.target.value)}
                  placeholder="São Paulo - SP (Metropolitana)" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Help sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">Centro de Controle</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              As alterações efetuadas nestas tabelas tarifárias são sincronizadas em tempo real com o banco de dados Firebase Firestore e aplicadas imediatamente a novos chamados criados pela plataforma.
            </p>
            <div className="border-t border-slate-800 pt-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Regra do Cálculo:</span>
              <p className="text-[11px] font-mono text-slate-300 mt-1 bg-slate-950/60 p-2 rounded-lg font-bold border border-slate-850">
                Valor = Máx(Tarifa Mínima, (Tarifa Base + (Km × R$/Km)) × Multiplicador)
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col gap-3">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold animate-in fade-in duration-200">
                <CheckCircle size={14} className="shrink-0" />
                <span>Configurações atualizadas no Firestore!</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2"
            >
              <Save size={14} />
              <span>{saving ? 'Gravando...' : 'Salvar Configurações'}</span>
            </Button>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
