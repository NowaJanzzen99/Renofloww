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
  geaccepteerd:   { label: 'Geaccepteerd',   color: '#10B981', bg: '#ECFDF5' },
  afgewezen:      { label: 'Afgewezen',      color: '#EF4444', bg: '#FEF2F2' },
  pending:        { label: 'In behandeling', color: '#F59E0B', bg: '#FFFBEB' },
  accepted:       { label: 'Geaccepteerd',   color: '#10B981', bg: '#ECFDF5' },
  rejected:       { label: 'Afgewezen',      color: '#EF4444', bg: '#FEF2F2' },
};

// Shared form fields for add/edit
function QuoteForm({
  project,
  contractors,
  initialContractorId,
  initialDescription,
  initialAmount,
  initialStatus,
  onClose,
  onSave,
  isEdit,
}: {
  project: Project;
  contractors: Contractor[];
  initialContractorId?: string;
  initialDescription?: string;
  initialAmount?: string;
  initialStatus?: string;
  onClose: () => void;
  onSave: (data: { contractorId: string; description: string; amount: string; status: string }) => Promise<void>;
  isEdit: boolean;
}) {
  const [contractorId, setContractorId] = useState(initialContractorId || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [amount, setAmount] = useState(initialAmount || '');
  const [status, setStatus] = useState(initialStatus || 'in_behandeling');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ contractorId, description, amount, status });
    setLoading(false);
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none';
  const inpStyle = { borderColor: '#E5E7EB', color: '#1A1A1A' };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#288760');
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#E5E7EB');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{isEdit ? 'Offerte bewerken' : 'Offerte toevoegen'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Aannemer</label>
            <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} className={inp} style={inpStyle} onFocus={focus} onBlur={blur}>
              <option value="">Geen specifieke aannemer</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
              <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={inpStyle} onFocus={focus} onBlur={blur} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Wat omvat de offerte?" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={inpStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp} style={inpStyle} onFocus={focus} onBlur={blur}>
              <option value="in_behandeling">In behandeling</option>
              <option value="geaccepteerd">Geaccepteerd</option>
              <option value="afgewezen">Afgewezen</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading || !amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddQuoteModal({ project, contractors, onClose, onAdded }: {
  project: Project;
  contractors: Contractor[];
  onClose: () => void;
  onAdded: (q: Quote) => void;
}) {
  return (
    <QuoteForm
      project={project}
      contractors={contractors}
      onClose={onClose}
      isEdit={false}
      onSave={async ({ contractorId, description, amount, status }) => {
        const supabase = createClient();
        const { data } = await supabase
          .from('quotes')
          .insert({
            project_id: project.id,
            contractor_id: contractorId || null,
            description: description || null,
            amount: parseFloat(amount),
            status,
          })
          .select()
          .single();
        if (data) onAdded(data);
      }}
    />
  );
}

function EditQuoteModal({ quote, project, contractors, onClose, onUpdated }: {
  quote: Quote & { contractors?: { name: string } | null };
  project: Project;
  contractors: Contractor[];
  onClose: () => void;
  onUpdated: (q: Quote) => void;
}) {
  return (
    <QuoteForm
      project={project}
      contractors={contractors}
      initialContractorId={quote.contractor_id || ''}
      initialDescription={quote.description || ''}
      initialAmount={String(quote.amount)}
      initialStatus={quote.status}
      onClose={onClose}
      isEdit={true}
      onSave={async ({ contractorId, description, amount, status }) => {
        const supabase = createClient();
        const { data } = await supabase
          .from('quotes')
          .update({
            contractor_id: contractorId || null,
            description: description || null,
            amount: parseFloat(amount),
            status,
          })
          .eq('id', quote.id)
          .select()
          .single();
        if (data) onUpdated(data);
      }}
    />
  );
}

// ── Versus.com-style compare modal ────────────────────────────────────────────
function CompareModal({
  quotes,
  getContractorName,
  onClose,
}: {
  quotes: (Quote & { contractors?: { name: string } | null })[];
  getContractorName: (q: Quote & { contractors?: { name: string } | null }) => string | null;
  onClose: () => void;
}) {
  const amounts = quotes.map((q) => Number(q.amount));
  const minAmt = Math.min(...amounts);
  const maxAmt = Math.max(...amounts);
  const savings = maxAmt - minAmt;

  const handleAiAdvice = () => {
    const quoteDetails = quotes
      .map((q, i) => {
        const name = getContractorName(q) || `Offerte ${i + 1}`;
        return `- ${name}: ${formatCurrency(Number(q.amount))}${q.description ? ` (${q.description})` : ''}`;
      })
      .join('\n');

    const message = `Analyseer deze offertes voor mijn verbouwing en geef advies welke ik moet kiezen:\n\n${quoteDetails}\n\nVerschil: ${formatCurrency(savings)}. Waar moet ik op letten bij het kiezen?`;

    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message } }));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Offertes vergelijken</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{quotes.length} offertes naast elkaar</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            style={{ color: '#6B7280' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Versus table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${quotes.length * 180 + 140}px` }}>
              <thead>
                <tr>
                  <th className="text-left pb-4 pr-4 w-36 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                    Onderdeel
                  </th>
                  {quotes.map((q) => {
                    const isMin = Number(q.amount) === minAmt;
                    const isMax = Number(q.amount) === maxAmt && quotes.length > 1;
                    const name = getContractorName(q);
                    return (
                      <th
                        key={q.id}
                        className="px-4 pb-4 text-center rounded-t-2xl"
                        style={{
                          backgroundColor: isMin ? '#ECFDF5' : isMax ? '#FFF1F2' : '#F9FAFB',
                          minWidth: '160px',
                        }}
                      >
                        {/* Badge */}
                        {isMin && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-2" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                            🏆 Laagste
                          </div>
                        )}
                        {isMax && quotes.length > 1 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-2" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                            Hoogste
                          </div>
                        )}
                        {!isMin && !isMax && <div className="mb-2 h-5" />}

                        {/* Contractor name */}
                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                          {name || <em style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Geen aannemer</em>}
                        </p>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {/* Bedrag row */}
                <tr>
                  <td className="py-4 pr-4 text-xs font-semibold uppercase tracking-wide align-top" style={{ color: '#9CA3AF' }}>
                    Bedrag
                  </td>
                  {quotes.map((q) => {
                    const amt = Number(q.amount);
                    const isMin = amt === minAmt;
                    const isMax = amt === maxAmt && quotes.length > 1;
                    const barPct = maxAmt > 0 ? (amt / maxAmt) * 100 : 100;
                    return (
                      <td
                        key={q.id}
                        className="px-4 py-4 text-center align-top"
                        style={{ backgroundColor: isMin ? '#ECFDF5' : isMax ? '#FFF1F2' : '#F9FAFB' }}
                      >
                        <p
                          className="text-2xl font-black mb-2"
                          style={{ color: isMin ? '#15803D' : isMax ? '#B91C1C' : '#1A1A1A' }}
                        >
                          {formatCurrency(amt)}
                        </p>
                        {/* Price bar */}
                        <div className="w-full h-2 rounded-full overflow-hidden mx-auto" style={{ backgroundColor: isMin ? '#BBF7D0' : isMax ? '#FECACA' : '#E5E7EB', maxWidth: '120px' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barPct}%`,
                              backgroundColor: isMin ? '#22C55E' : isMax ? '#EF4444' : '#9CA3AF',
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Besparing row (only when > 1 quote and savings > 0) */}
                {savings > 0 && (
                  <tr className="border-t" style={{ borderColor: '#F3F4F6' }}>
                    <td className="py-4 pr-4 text-xs font-semibold uppercase tracking-wide align-top" style={{ color: '#9CA3AF' }}>
                      Besparing
                    </td>
                    {quotes.map((q) => {
                      const amt = Number(q.amount);
                      const isMin = amt === minAmt;
                      const isMax = amt === maxAmt;
                      const diff = amt - minAmt;
                      return (
                        <td
                          key={q.id}
                          className="px-4 py-4 text-center align-top"
                          style={{ backgroundColor: isMin ? '#ECFDF5' : isMax ? '#FFF1F2' : '#F9FAFB' }}
                        >
                          {isMin ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#15803D' }}>
                              ✅ Voordeligst
                            </span>
                          ) : (
                            <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>
                              +{formatCurrency(diff)} duurder
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}

                {/* Omschrijving row */}
                <tr className="border-t" style={{ borderColor: '#F3F4F6' }}>
                  <td className="py-4 pr-4 text-xs font-semibold uppercase tracking-wide align-top" style={{ color: '#9CA3AF' }}>
                    Omschrijving
                  </td>
                  {quotes.map((q) => {
                    const isMin = Number(q.amount) === minAmt;
                    const isMax = Number(q.amount) === maxAmt && quotes.length > 1;
                    return (
                      <td
                        key={q.id}
                        className="px-4 py-4 text-center align-top"
                        style={{ backgroundColor: isMin ? '#ECFDF5' : isMax ? '#FFF1F2' : '#F9FAFB' }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                          {q.description || <em>Geen omschrijving</em>}
                        </p>
                      </td>
                    );
                  })}
                </tr>

                {/* Status row */}
                <tr className="border-t" style={{ borderColor: '#F3F4F6' }}>
                  <td className="py-4 pr-4 pb-0 text-xs font-semibold uppercase tracking-wide align-top" style={{ color: '#9CA3AF' }}>
                    Status
                  </td>
                  {quotes.map((q) => {
                    const isMin = Number(q.amount) === minAmt;
                    const isMax = Number(q.amount) === maxAmt && quotes.length > 1;
                    const sInfo = statusConfig[q.status as keyof typeof statusConfig] || statusConfig.in_behandeling;
                    return (
                      <td
                        key={q.id}
                        className="px-4 py-4 pb-0 text-center align-top rounded-b-2xl"
                        style={{ backgroundColor: isMin ? '#ECFDF5' : isMax ? '#FFF1F2' : '#F9FAFB' }}
                      >
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: sInfo.bg, color: sInfo.color }}
                        >
                          {sInfo.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Savings summary card */}
          {savings > 0 && (
            <div
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}
            >
              <div className="text-3xl shrink-0">💰</div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                  Kies de voordeligste offerte en bespaar {formatCurrency(savings)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  ten opzichte van de duurste offerte
                </p>
              </div>
            </div>
          )}

          {/* AI advice button */}
          <button
            onClick={handleAiAdvice}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)',
              boxShadow: '0 4px 20px rgba(40,135,96,0.35)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
            </svg>
            Vraag AI advies over deze offertes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Accepted → add to costs popup ─────────────────────────────────────────────
const expenseCategories = [
  { value: 'arbeid',     label: '👷 Arbeid' },
  { value: 'materiaal',  label: '🧱 Materiaal' },
  { value: 'vergunning', label: '📋 Vergunning' },
  { value: 'transport',  label: '🚚 Transport' },
  { value: 'overig',     label: '📦 Overig' },
];

function AddToCostsModal({
  quote,
  contractorName,
  projectId,
  onClose,
  onAdded,
}: {
  quote: Quote & { contractors?: { name: string } | null };
  contractorName: string | null;
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const defaultDesc = contractorName
    ? `${contractorName}${quote.description ? ` – ${quote.description}` : ''}`
    : quote.description || 'Offerte';

  const [description, setDescription] = useState(defaultDesc);
  const [category, setCategory]       = useState('arbeid');
  const [loading, setLoading]         = useState(false);

  const inp   = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none';
  const style = { borderColor: '#E5E7EB', color: '#1A1A1A' };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#288760');
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#E5E7EB');

  const handleConfirm = async () => {
    setLoading(true);
    const supabase = createClient();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await supabase.from('expenses').insert({
      project_id:  projectId,
      description: description.trim() || defaultDesc,
      amount:      Number(quote.amount),
      category,
      date:        dateStr,
    });

    setLoading(false);
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Green header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a5140 0%, #288760 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎉</div>
            <div>
              <h2 className="text-base font-bold text-white">Offerte geaccepteerd!</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Wil je dit ook toevoegen aan je kosten?</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Amount preview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
            <span className="text-sm font-medium" style={{ color: '#15803D' }}>Bedrag</span>
            <span className="text-lg font-black" style={{ color: '#15803D' }}>
              {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(quote.amount))}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving kosten</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inp}
              style={style}
              onFocus={focus}
              onBlur={blur}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Categorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp} style={style} onFocus={focus} onBlur={blur}>
              {expenseCategories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              Nee, overslaan
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: '#288760' }}
            >
              {loading ? 'Toevoegen...' : '✓ Ja, voeg toe aan kosten'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main tab component ─────────────────────────────────────────────────────────
export default function OffertesTab({ project, initialQuotes, initialContractors }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<(Quote & { contractors?: { name: string } | null }) | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  // Add-to-costs popup after accepting a quote
  const [addToCostsQuote, setAddToCostsQuote] = useState<(Quote & { contractors?: { name: string } | null }) | null>(null);

  const getContractorName = (q: Quote & { contractors?: { name: string } | null }): string | null =>
    q.contractors?.name || initialContractors.find((c) => c.id === q.contractor_id)?.name || null;

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
    // When a quote is accepted, offer to add it to costs
    if (status === 'geaccepteerd') {
      const accepted = quotes.find((q) => q.id === id);
      if (accepted) setAddToCostsQuote(accepted);
    }
  };

  const deleteQuote = async (id: string) => {
    const supabase = createClient();
    await supabase.from('quotes').delete().eq('id', id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setCompareIds((prev) => prev.filter((x) => x !== id));
    setDeletingId(null);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compareQuotes = quotes.filter((q) => compareIds.includes(q.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Offertes ({quotes.length})</h2>
          {quotes.length >= 2 && (
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {compareIds.length === 0
                ? 'Vink offertes aan om ze te vergelijken'
                : compareIds.length === 1
                ? '1 geselecteerd — selecteer nog minimaal 1'
                : `${compareIds.length} geselecteerd — klaar om te vergelijken`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {quotes.length >= 2 && (
            <button
              onClick={() => compareIds.length >= 2 ? setShowCompare(true) : undefined}
              disabled={compareIds.length < 2}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                borderColor: compareIds.length >= 2 ? '#288760' : '#E5E7EB',
                color: compareIds.length >= 2 ? '#288760' : '#9CA3AF',
                backgroundColor: compareIds.length >= 2 ? '#F0FDF4' : 'transparent',
              }}
              title={compareIds.length < 2 ? 'Selecteer minimaal 2 offertes om te vergelijken' : undefined}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Vergelijk{compareIds.length >= 2 ? ` (${compareIds.length})` : ''}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#288760' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Offerte toevoegen
          </button>
        </div>
      </div>

      {/* Quote cards */}
      <div className="space-y-3">
        {quotes.map((quote) => {
          const isMin = Number(quote.amount) === minAmount && quotes.length > 1;
          const isMax = Number(quote.amount) === maxAmount && quotes.length > 1;
          const statusInfo = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.in_behandeling;
          const isSelected = compareIds.includes(quote.id);
          const contractorName = getContractorName(quote);

          return (
            <div
              key={quote.id}
              className="rounded-2xl p-4 bg-white border transition-all"
              style={{
                borderColor: isSelected ? '#288760' : isMin ? '#86EFAC' : '#E5E7EB',
                boxShadow: isSelected ? '0 0 0 2px #28876022' : '0 2px 12px rgba(0,0,0,0.06)',
                backgroundColor: isMin ? '#F0FDF4' : 'white',
              }}
            >
              {/* Row 1: checkbox + naam + badges + actie-knoppen */}
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleCompare(quote.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? '#288760' : '#D1D5DB',
                    backgroundColor: isSelected ? '#288760' : 'white',
                  }}
                  title="Selecteer voor vergelijking"
                  aria-label="Selecteer voor vergelijking"
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {contractorName ? (
                      <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{contractorName}</p>
                    ) : (
                      <p className="text-sm italic" style={{ color: '#9CA3AF' }}>Geen aannemer gekoppeld</p>
                    )}
                    {isMin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                        🏆 Laagste
                      </span>
                    )}
                    {isMax && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        Hoogste
                      </span>
                    )}
                  </div>
                  {quote.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{quote.description}</p>
                  )}
                </div>

                {/* Actie-knoppen altijd rechts van de naam */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingQuote(quote)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                    title="Bewerken"
                    style={{ color: '#6B7280' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingId(quote.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                    title="Verwijderen"
                    style={{ color: '#9CA3AF' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#EF4444')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Row 2: prijs + status-dropdown */}
              <div className="flex items-center gap-3 mt-2.5 pl-8">
                <p className="text-sm font-bold shrink-0" style={{ color: '#1A1A1A' }}>
                  {formatCurrency(Number(quote.amount))}
                </p>
                <select
                  value={quote.status}
                  onChange={(e) => updateStatus(quote.id, e.target.value)}
                  className="flex-1 px-2 py-1 rounded-xl text-xs font-medium border outline-none"
                  style={{ borderColor: statusInfo.color, color: statusInfo.color, backgroundColor: statusInfo.bg, maxWidth: '160px' }}
                >
                  <option value="in_behandeling">In behandeling</option>
                  <option value="geaccepteerd">Geaccepteerd</option>
                  <option value="afgewezen">Afgewezen</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper when 2+ selected but compare not opened */}
      {compareIds.length >= 2 && !showCompare && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl border" style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
          <p className="text-sm font-medium" style={{ color: '#15803D' }}>
            {compareIds.length} offertes geselecteerd
          </p>
          <button
            onClick={() => setShowCompare(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#288760' }}
          >
            Vergelijk nu →
          </button>
        </div>
      )}

      {/* Versus modal */}
      {showCompare && compareQuotes.length >= 2 && (
        <CompareModal
          quotes={compareQuotes}
          getContractorName={getContractorName}
          onClose={() => setShowCompare(false)}
        />
      )}

      {showAddModal && (
        <AddQuoteModal
          project={project}
          contractors={initialContractors}
          onClose={() => setShowAddModal(false)}
          onAdded={(q) => { setQuotes([q, ...quotes]); setShowAddModal(false); }}
        />
      )}

      {/* Edit modal */}
      {editingQuote && (
        <EditQuoteModal
          quote={editingQuote}
          project={project}
          contractors={initialContractors}
          onClose={() => setEditingQuote(null)}
          onUpdated={(updated) => {
            setQuotes((prev) => prev.map((q) => q.id === updated.id ? { ...q, ...updated } : q));
            setEditingQuote(null);
          }}
        />
      )}

      {/* Add-to-costs popup — shown when a quote is accepted */}
      {addToCostsQuote && (
        <AddToCostsModal
          quote={addToCostsQuote}
          contractorName={getContractorName(addToCostsQuote)}
          projectId={project.id}
          onClose={() => setAddToCostsQuote(null)}
          onAdded={() => setAddToCostsQuote(null)}
        />
      )}

      {/* Delete confirm dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEF2F2' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#EF4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-center mb-2" style={{ color: '#1A1A1A' }}>Offerte verwijderen?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>Dit kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Annuleren
              </button>
              <button
                onClick={() => deleteQuote(deletingId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
