'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Project, ExtraWork, Contractor } from '@/types';

interface Props {
  project: Project;
  initialExtraWork: (ExtraWork & { contractors?: { name: string } | null })[];
  initialContractors: Contractor[];
}

const statusConfig = {
  aangevraagd: { label: 'Aangevraagd', color: '#F59E0B', bg: '#FFFBEB' },
  goedgekeurd: { label: 'Goedgekeurd', color: '#10B981', bg: '#ECFDF5' },
  afgewezen: { label: 'Afgewezen', color: '#EF4444', bg: '#FEF2F2' },
};

export default function MeerwerkTab({ project, initialExtraWork, initialContractors }: Props) {
  const [extraWork, setExtraWork] = useState(initialExtraWork);
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const totalApproved = extraWork
    .filter((e) => e.status === 'goedgekeurd')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from('extra_work').update({ status }).eq('id', id);
    setExtraWork((prev) => prev.map((e) => e.id === id ? { ...e, status: status as ExtraWork['status'] } : e));
  };

  const addExtraWork = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('extra_work')
      .insert({ project_id: project.id, contractor_id: contractorId || null, description, amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')), status: 'aangevraagd' })
      .select('*, contractors(name)')
      .single();
    if (data) setExtraWork((prev) => [data, ...prev]);
    setDescription(''); setAmount(''); setContractorId('');
    setShowAddModal(false);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Meerwerk ({extraWork.length})</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Goedgekeurd: <strong style={{ color: '#288760' }}>{formatCurrency(totalApproved)}</strong></p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white shrink-0" style={{ backgroundColor: '#288760' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Meerwerk toevoegen
        </button>
      </div>

      {extraWork.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">🔧</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Geen meerwerk verzoeken</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Houd hier bij welk extra werk is aangevraagd.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {extraWork.map((item) => {
            const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.aangevraagd;
            const contractorName = item.contractors?.name || initialContractors.find((c) => c.id === item.contractor_id)?.name;

            return (
              <div key={item.id} className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{item.description}</p>
                    {contractorName && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{contractorName}</p>}
                    <p className="text-base font-bold mt-1" style={{ color: '#1A1A1A' }}>{formatCurrency(Number(item.amount))}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                    {item.status === 'aangevraagd' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(item.id, 'goedgekeurd')} className="px-2 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: '#10B981' }}>
                          Goedkeuren
                        </button>
                        <button onClick={() => updateStatus(item.id, 'afgewezen')} className="px-2 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: '#EF4444' }}>
                          Afwijzen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Meerwerk toevoegen</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={addExtraWork} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving *</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Bijv. Extra isolatie vloer" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Aannemer</label>
                <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
                  <option value="">Geen specifieke aannemer</option>
                  {initialContractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
                  <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.500" className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
                <button type="submit" disabled={loading || !description || !amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
                  {loading ? 'Opslaan...' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
