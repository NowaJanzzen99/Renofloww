'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Project, Quote, Contractor } from '@/types';

interface Props {
  project: Project;
  initialQuotes: (Quote & { contractors?: { name: string } | null })[];
  initialContractors: Contractor[];
}

const statusConfig = {
  in_behandeling: { label: 'In behandeling', color: '#F59E0B', bg: '#FFFBEB' },
  geaccepteerd: { label: 'Geaccepteerd', color: '#10B981', bg: '#ECFDF5' },
  afgewezen: { label: 'Afgewezen', color: '#EF4444', bg: '#FEF2F2' },
  pending: { label: 'In behandeling', color: '#F59E0B', bg: '#FFFBEB' },
};

function AddQuoteModal({ project, contractors, onClose, onAdded }: {
  project: Project;
  contractors: Contractor[];
  onClose: () => void;
  onAdded: (q: Quote) => void;
}) {
  const [contractorId, setContractorId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('in_behandeling');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('quotes')
      .insert({
        project_id: project.id,
        contractor_id: contractorId || null,
        description: description || null,
        amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
        status,
      })
      .select()
      .single();
    if (data) onAdded(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Offerte toevoegen</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Aannemer</label>
            <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
              <option value="">Geen specifieke aannemer</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
              <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5.000" className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Wat omvat de offerte?" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
              <option value="in_behandeling">In behandeling</option>
              <option value="geaccepteerd">Geaccepteerd</option>
              <option value="afgewezen">Afgewezen</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading || !amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OffertesTab({ project, initialQuotes, initialContractors }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  if (quotes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Offertes (0)</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Offerte toevoegen
          </button>
        </div>
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Nog geen offertes</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Voeg offertes toe om ze te vergelijken.</p>
        </div>
        {showAddModal && <AddQuoteModal project={project} contractors={initialContractors} onClose={() => setShowAddModal(false)} onAdded={(q) => { setQuotes([q, ...quotes]); setShowAddModal(false); }} />}
      </div>
    );
  }

  const amounts = quotes.map((q) => Number(q.amount));
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from('quotes').update({ status }).eq('id', id);
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: status as Quote['status'] } : q));
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const compareQuotes = quotes.filter((q) => compareIds.includes(q.id));
  const getContractorName = (q: Quote & { contractors?: { name: string } | null }): string | null =>
    q.contractors?.name || initialContractors.find((c) => c.id === q.contractor_id)?.name || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Offertes ({quotes.length})</h2>
          {quotes.length >= 2 && (
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {compareIds.length === 0
                ? 'Vink offertes aan om ze te vergelijken'
                : compareIds.length === 1
                ? '1 geselecteerd — selecteer nog minimaal 1'
                : `${compareIds.length} geselecteerd`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {quotes.length >= 2 && (
            <button
              onClick={() => compareIds.length >= 2 ? setShowCompare(true) : undefined}
              disabled={compareIds.length < 2}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{
                borderColor: compareIds.length >= 2 ? '#288760' : '#E5E7EB',
                color: compareIds.length >= 2 ? '#288760' : '#9CA3AF',
                backgroundColor: compareIds.length >= 2 ? '#F0FDF4' : 'transparent',
              }}
              title={compareIds.length < 2 ? 'Selecteer 2 of meer offertes om te vergelijken' : undefined}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Vergelijk offertes{compareIds.length >= 2 ? ` (${compareIds.length})` : ''}
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Offerte toevoegen
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {quotes.map((quote) => {
          const isMin = Number(quote.amount) === minAmount && quotes.length > 1;
          const isMax = Number(quote.amount) === maxAmount && quotes.length > 1;
          const statusInfo = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.in_behandeling;
          const isSelected = compareIds.includes(quote.id);

          return (
            <div
              key={quote.id}
              className="rounded-2xl p-4 bg-white border"
              style={{
                borderColor: isMin ? '#10B981' : isMax && quotes.length > 1 ? '#FCA5A5' : '#E5E7EB',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                backgroundColor: isMin ? '#F0FDF4' : 'white',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCompare(quote.id)}
                    className="w-4 h-4 rounded mt-0.5 shrink-0"
                    style={{ accentColor: '#288760' }}
                    title="Selecteer voor vergelijking"
                    aria-label="Selecteer voor vergelijking"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getContractorName(quote) ? (
                        <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                          {getContractorName(quote)}
                        </p>
                      ) : (
                        <p className="text-sm italic" style={{ color: '#9CA3AF' }}>
                          Geen aannemer gekoppeld
                        </p>
                      )}
                      {isMin && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>Laagste</span>}
                      {isMax && quotes.length > 1 && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Hoogste</span>}
                    </div>
                    {quote.description && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{quote.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-base font-bold" style={{ color: '#1A1A1A' }}>{formatCurrency(Number(quote.amount))}</p>
                  <select
                    value={quote.status}
                    onChange={(e) => updateStatus(quote.id, e.target.value)}
                    className="px-2 py-1 rounded-xl text-xs font-medium border outline-none"
                    style={{ borderColor: statusInfo.color, color: statusInfo.color, backgroundColor: statusInfo.bg }}
                  >
                    <option value="in_behandeling">In behandeling</option>
                    <option value="geaccepteerd">Geaccepteerd</option>
                    <option value="afgewezen">Afgewezen</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare modal */}
      {showCompare && compareQuotes.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Offertes vergelijken</h2>
              <button onClick={() => setShowCompare(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4" style={{ color: '#6B7280' }}>Onderdeel</th>
                    {compareQuotes.map((q) => (
                      <th key={q.id} className="text-left py-2 px-2" style={{ color: '#1A1A1A' }}>{getContractorName(q) ?? <em style={{ color: '#9CA3AF' }}>Geen aannemer</em>}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Bedrag', key: 'amount', format: (v: string) => formatCurrency(Number(v)) },
                    { label: 'Omschrijving', key: 'description', format: (v: string) => v || '—' },
                    { label: 'Status', key: 'status', format: (v: string) => statusConfig[v as keyof typeof statusConfig]?.label || v },
                  ].map(({ label, key, format }) => (
                    <tr key={label} className="border-t" style={{ borderColor: '#E5E7EB' }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: '#6B7280' }}>{label}</td>
                      {compareQuotes.map((q) => (
                        <td key={q.id} className="py-3 px-2" style={{ color: '#1A1A1A' }}>
                          {format(String((q as unknown as Record<string, unknown>)[key] ?? ''))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddQuoteModal project={project} contractors={initialContractors} onClose={() => setShowAddModal(false)} onAdded={(q) => { setQuotes([q, ...quotes]); setShowAddModal(false); }} />
      )}
    </div>
  );
}
