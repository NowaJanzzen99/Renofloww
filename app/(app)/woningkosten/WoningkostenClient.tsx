'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { House, OnderhoudKost, OnderhoudCategorie } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectExpense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  project_name: string;
  project_id: string;
}

interface Props {
  house: House | null;
  projectExpenses: ProjectExpense[];
  onderhoudKosten: OnderhoudKost[];
  projects: { id: string; name: string }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ONDERHOUD_CATS: { value: OnderhoudCategorie; label: string; emoji: string }[] = [
  { value: 'onderhoud',  label: 'Onderhoud',   emoji: '🔧' },
  { value: 'reparatie',  label: 'Reparatie',   emoji: '🛠️' },
  { value: 'tuin',       label: 'Tuin',        emoji: '🌿' },
  { value: 'verzekering',label: 'Verzekering', emoji: '🛡️' },
  { value: 'energie',    label: 'Energie',     emoji: '⚡' },
  { value: 'belasting',  label: 'Belasting',   emoji: '🏦' },
  { value: 'overig',     label: 'Overig',      emoji: '📦' },
];

const WONINGTYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  tussenwoning: 'Tussenwoning',
  hoekwoning: 'Hoekwoning',
  twee_onder_een_kap: '2-onder-1-kap',
  vrijstaand: 'Vrijstaand',
};

// ─── House profile form ────────────────────────────────────────────────────────

function HouseProfileModal({
  house,
  onClose,
  onSaved,
}: {
  house: House | null;
  onClose: () => void;
  onSaved: (h: House) => void;
}) {
  const [address, setAddress] = useState(house?.address || '');
  const [postcode, setPostcode] = useState(house?.postcode || '');
  const [woningtype, setWoningtype] = useState(house?.woningtype || '');
  const [surfaceM2, setSurfaceM2] = useState(house?.surface_m2 ? String(house.surface_m2) : '');
  const [purchasePrice, setPurchasePrice] = useState(house?.purchase_price ? String(house.purchase_price) : '');
  const [purchaseDate, setPurchaseDate] = useState(house?.purchase_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none';
  const inpStyle = { borderColor: '#E5E7EB', color: '#1A1A1A' };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = '#288760');
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = '#E5E7EB');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const payload = {
        user_id: user.id,
        address: address || null,
        postcode: postcode || null,
        woningtype: (woningtype as House['woningtype']) || null,
        surface_m2: surfaceM2 ? parseFloat(surfaceM2) : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice.replace(/\./g, '').replace(',', '.')) : null,
        purchase_date: purchaseDate || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (house) {
        const { data, error: err } = await supabase.from('houses').update(payload).eq('id', house.id).select().single();
        if (err) throw err;
        result = data;
      } else {
        const { data, error: err } = await supabase.from('houses').insert(payload).select().single();
        if (err) throw err;
        result = data;
      }
      onSaved(result);
    } catch {
      setError('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 bg-white" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Woning profiel</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Adres</label>
            <input className={inp} style={inpStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Hoofdstraat 1" onFocus={focus} onBlur={blur} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Postcode</label>
              <input className={inp} style={inpStyle} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="1234 AB" onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Oppervlakte (m²)</label>
              <input type="number" min="0" className={inp} style={inpStyle} value={surfaceM2} onChange={(e) => setSurfaceM2(e.target.value)} placeholder="120" onFocus={focus} onBlur={blur} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Woningtype</label>
            <select className={inp} style={inpStyle} value={woningtype} onChange={(e) => setWoningtype(e.target.value)} onFocus={focus} onBlur={blur}>
              <option value="">Selecteer type</option>
              {Object.entries(WONINGTYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Aankoopprijs</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
              <input type="number" min="0" className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={inpStyle} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="350.000" onFocus={focus} onBlur={blur} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Aankoopdatum</label>
            <input type="date" className={inp} style={inpStyle} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add onderhoud kost modal ─────────────────────────────────────────────────

function AddKostModal({
  houseId,
  projects,
  onClose,
  onAdded,
}: {
  houseId: string;
  projects: { id: string; name: string }[];
  onClose: () => void;
  onAdded: (k: OnderhoudKost) => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<OnderhoudCategorie>('onderhoud');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);

  const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none';
  const inpStyle = { borderColor: '#E5E7EB', color: '#1A1A1A' };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#288760');
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#E5E7EB');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const { data, error } = await supabase
        .from('onderhoud_kosten')
        .insert({
          house_id: houseId,
          user_id: user.id,
          date,
          amount: parseFloat(amount.replace(',', '.')),
          category,
          description,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (error) throw error;
      onAdded(data);
    } catch {
      alert('Opslaan mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[88dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Onderhoudskosten toevoegen</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving *</label>
            <input required className={inp} style={inpStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bijv. Dakgoot gereinigd" onFocus={focus} onBlur={blur} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
                <input required type="number" min="0" step="0.01" className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={inpStyle} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Datum</label>
              <input type="date" className={inp} style={inpStyle} value={date} onChange={(e) => setDate(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Categorie</label>
            <select className={inp} style={inpStyle} value={category} onChange={(e) => setCategory(e.target.value as OnderhoudCategorie)} onFocus={focus} onBlur={blur}>
              {ONDERHOUD_CATS.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Koppel aan project (optioneel)</label>
              <select className={inp} style={inpStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)} onFocus={focus} onBlur={blur}>
                <option value="">Geen project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading || !description || !amount} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Bar chart helper ─────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WoningkostenClient({ house: initialHouse, projectExpenses, onderhoudKosten: initialOnderhoud, projects }: Props) {
  const [house, setHouse] = useState<House | null>(initialHouse);
  const [onderhoud, setOnderhoud] = useState<OnderhoudKost[]>(initialOnderhoud);
  const [showHouseModal, setShowHouseModal] = useState(false);
  const [showAddKost, setShowAddKost] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalVerbouwing = useMemo(() => projectExpenses.reduce((s, e) => s + e.amount, 0), [projectExpenses]);
  const totalOnderhoud  = useMemo(() => onderhoud.reduce((s, k) => s + Number(k.amount), 0), [onderhoud]);
  const totalInvested   = totalVerbouwing + totalOnderhoud;
  const realOwnership   = house?.purchase_price ? Number(house.purchase_price) + totalInvested : null;

  // ── Combined cost list ─────────────────────────────────────────────────────
  type CombinedEntry = {
    id: string; date: string; amount: number;
    description: string; category: string;
    source: 'project' | 'onderhoud'; label: string;
  };

  const allCosts: CombinedEntry[] = useMemo(() => {
    const p: CombinedEntry[] = projectExpenses.map((e) => ({
      id: e.id, date: e.date, amount: e.amount,
      description: e.description, category: e.category,
      source: 'project', label: e.project_name,
    }));
    const o: CombinedEntry[] = onderhoud.map((k) => ({
      id: k.id, date: k.date, amount: Number(k.amount),
      description: k.description, category: k.category,
      source: 'onderhoud', label: 'Onderhoud',
    }));
    return [...p, ...o].sort((a, b) => b.date.localeCompare(a.date));
  }, [projectExpenses, onderhoud]);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    allCosts.forEach((c) => { map[c.category] = (map[c.category] || 0) + c.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allCosts]);

  const maxCatAmount = categoryTotals[0]?.[1] ?? 0;

  const catLabel = (cat: string) => {
    const found = ONDERHOUD_CATS.find((c) => c.value === cat);
    if (found) return `${found.emoji} ${found.label}`;
    const projLabels: Record<string, string> = {
      materiaal: '🧱 Materiaal', arbeid: '👷 Arbeid',
      vergunning: '📋 Vergunning', transport: '🚚 Transport', overig: '📦 Overig',
    };
    return projLabels[cat] || cat;
  };

  // ── Yearly breakdown ───────────────────────────────────────────────────────
  const yearlyData = useMemo(() => {
    const map: Record<number, CombinedEntry[]> = {};
    allCosts.forEach((c) => {
      const y = new Date(c.date).getFullYear();
      if (!map[y]) map[y] = [];
      map[y].push(c);
    });
    return Object.entries(map)
      .map(([year, entries]) => ({
        year: parseInt(year),
        total: entries.reduce((s, e) => s + e.amount, 0),
        entries,
      }))
      .sort((a, b) => b.year - a.year);
  }, [allCosts]);

  const maxYearAmount = yearlyData[0]?.total ?? 0;

  const toggleYear = (y: number) =>
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-28 md:pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Woningkosten</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Totaaloverzicht van je investering in je woning</p>
        </div>
        <div className="flex gap-2">
          {house && (
            <button
              onClick={() => setShowAddKost(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white shrink-0"
              style={{ backgroundColor: '#288760' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Kosten toevoegen
            </button>
          )}
        </div>
      </div>

      {/* ── House profile card ─────────────────────────────────────── */}
      {!house ? (
        <div
          className="rounded-2xl p-6 text-center border-2 border-dashed cursor-pointer transition-colors hover:border-green-400"
          style={{ borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' }}
          onClick={() => setShowHouseModal(true)}
        >
          <div className="text-4xl mb-3">🏠</div>
          <h3 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>Stel je woning in</h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Voeg je woninggegevens toe om kosten bij te houden</p>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#288760' }}
            onClick={(e) => { e.stopPropagation(); setShowHouseModal(true); }}
          >
            Woning instellen
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: '#F0FDF4' }}>🏠</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>
                  {house.address || 'Mijn woning'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {[
                    house.postcode,
                    house.woningtype ? WONINGTYPE_LABELS[house.woningtype] : null,
                    house.surface_m2 ? `${house.surface_m2} m²` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHouseModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 hover:bg-gray-50"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              Bewerken
            </button>
          </div>
        </div>
      )}

      {/* ── Stats cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Verbouwing', value: totalVerbouwing, icon: '🔨', color: '#288760' },
          { label: 'Onderhoud', value: totalOnderhoud,   icon: '🔧', color: '#3B82F6' },
          { label: 'Totaal geïnvesteerd', value: totalInvested, icon: '💰', color: '#8B5CF6' },
          ...(house?.purchase_price
            ? [{ label: 'Werkelijke eigendomskosten', value: realOwnership!, icon: '🏠', color: '#F59E0B' }]
            : []),
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-lg font-black leading-tight" style={{ color: s.color }}>{formatCurrency(s.value)}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.label}</p>
          </div>
        ))}
        {house?.purchase_price && (
          <div className="col-span-2 sm:col-span-4 rounded-2xl p-4 border" style={{ borderColor: '#B7E5BA', backgroundColor: '#F0FDF4' }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#1a5140' }}>
              💡 Aankoopprijs {formatCurrency(Number(house.purchase_price))} + {formatCurrency(totalInvested)} geïnvesteerd
              = werkelijke eigendomskosten <strong>{formatCurrency(realOwnership!)}</strong>
            </p>
          </div>
        )}
      </div>

      {/* ── Category breakdown ─────────────────────────────────────── */}
      {categoryTotals.length > 0 && (
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Per categorie</h2>
          <div className="space-y-3">
            {categoryTotals.map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-3">
                <p className="text-xs w-32 shrink-0" style={{ color: '#374151' }}>{catLabel(cat)}</p>
                <MiniBar value={total} max={maxCatAmount} color="#288760" />
                <p className="text-xs font-semibold shrink-0 text-right w-20" style={{ color: '#1A1A1A' }}>{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Yearly breakdown ───────────────────────────────────────── */}
      {yearlyData.length > 0 && (
        <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Per jaar</h2>
          </div>
          {/* Simple bar chart */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-end gap-2 h-20">
              {yearlyData.slice().reverse().map((yd) => {
                const pct = maxYearAmount > 0 ? (yd.total / maxYearAmount) * 100 : 0;
                return (
                  <div key={yd.year} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, pct * 0.7)}px`, backgroundColor: '#288760', opacity: 0.85 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{yd.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Accordion rows */}
          <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
            {yearlyData.map((yd) => (
              <div key={yd.year}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleYear(yd.year)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 transition-transform duration-200"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: '#9CA3AF', transform: expandedYears.has(yd.year) ? 'rotate(90deg)' : '' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{yd.year}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{yd.entries.length} posten</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#288760' }}>{formatCurrency(yd.total)}</span>
                </button>
                {expandedYears.has(yd.year) && (
                  <div className="px-5 pb-3">
                    <div className="space-y-2 pl-7">
                      {yd.entries.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-4 py-1.5 border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>{e.description}</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>
                              {catLabel(e.category)} · {e.label} · {formatDate(e.date)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold shrink-0" style={{ color: '#1A1A1A' }}>{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All costs list ─────────────────────────────────────────── */}
      {allCosts.length === 0 && house ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">💸</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Nog geen kosten</p>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Voeg onderhoudskosten toe of registreer kosten via je projecten.</p>
          <button
            onClick={() => setShowAddKost(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#288760' }}
          >
            Kosten toevoegen
          </button>
        </div>
      ) : allCosts.length > 0 ? (
        <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Alle kosten ({allCosts.length})</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
            {allCosts.slice(0, 50).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: c.source === 'project' ? '#F0FDF4' : '#EFF6FF' }}>
                  {c.source === 'project' ? '🔨' : '🔧'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{c.description}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {catLabel(c.category)} · {c.label} · {formatDate(c.date)}
                  </p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: '#1A1A1A' }}>{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
          {allCosts.length > 50 && (
            <div className="px-5 py-3 text-center border-t" style={{ borderColor: '#F3F4F6' }}>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Toont 50 van {allCosts.length} posten</p>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {showHouseModal && (
        <HouseProfileModal
          house={house}
          onClose={() => setShowHouseModal(false)}
          onSaved={(h) => { setHouse(h); setShowHouseModal(false); }}
        />
      )}

      {showAddKost && house && (
        <AddKostModal
          houseId={house.id}
          projects={projects}
          onClose={() => setShowAddKost(false)}
          onAdded={(k) => { setOnderhoud((prev) => [k, ...prev]); setShowAddKost(false); }}
        />
      )}
    </div>
  );
}
