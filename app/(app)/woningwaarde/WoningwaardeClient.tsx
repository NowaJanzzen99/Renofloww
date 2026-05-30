'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { House } from '@/types';

interface QuarterPoint { period: string; quarter: number; year: number; index: number }
interface YearPoint    { year: number; index: number }
interface MortgageRate { rate: number; period: string; label: string }

interface MarketData {
  estimate: number | null;
  low: number | null;
  high: number | null;
  latestPeriod: string;
  latestIndex: number;
  purchaseIndex: number | null;
  quarterlyData: QuarterPoint[];
  yearlyData: YearPoint[];
  mortgageRate: MortgageRate | null;
  source: string;
  isFallback: boolean;
  fetchedAt: string;
}

interface Props {
  house: House | null;
  totalInvested: number;
  isPro: boolean;
  projectStartDate: string | null;
}

const WONINGTYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  tussenwoning: 'Tussenwoning',
  hoekwoning: 'Hoekwoning',
  twee_onder_een_kap: '2-onder-1-kap',
  vrijstaand: 'Vrijstaand',
};

function formatPeriod(p: string): string {
  const year = p.substring(0, 4);
  if (p.includes('KW')) return `Q${p.charAt(6)} ${year}`;
  if (p.includes('JJ')) return year;
  return p;
}

function OverwaardeCard({
  estimate, low, high, totalInvested, purchasePrice, updatedAt, source, isFallback,
}: {
  estimate: number; low: number; high: number;
  totalInvested: number; purchasePrice: number;
  updatedAt: string; source: string; isFallback: boolean;
}) {
  const nominaalOverwaarde = estimate - purchasePrice;
  const werkelijkOverwaarde = estimate - (purchasePrice + totalInvested);

  return (
    <div className="space-y-4">
      {/* Estimated value */}
      <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>Geschatte marktwaarde</p>
            <p className="text-3xl font-black leading-tight" style={{ color: '#1A1A1A' }}>{formatCurrency(estimate)}</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Bandbreedte: {formatCurrency(low)} — {formatCurrency(high)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: '#F0FDF4' }}>📈</div>
        </div>
        <div className="pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Bron: {source} · Bijgewerkt: {formatPeriod(updatedAt)}
            {isFallback && ' · Schattingsdata (CBS API tijdelijk niet beschikbaar)'}
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: '#F59E0B' }}>
            ⚠️ Dit is een indicatie op basis van marktdata, geen officiële taxatie.
          </p>
        </div>
      </div>

      {/* Three-number breakdown */}
      <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Jouw werkelijke overwaarde</h3>
        <div className="space-y-3">
          {[
            { label: 'Geschatte marktwaarde',      value: estimate,           color: '#288760', icon: '🏠' },
            { label: 'Werkelijke investering',      value: purchasePrice + totalInvested, color: '#6B7280', icon: '💸', sub: `Aankoopprijs ${formatCurrency(purchasePrice)} + ${formatCurrency(totalInvested)} verbouwing/onderhoud` },
            { label: 'Werkelijke overwaarde',       value: werkelijkOverwaarde, color: werkelijkOverwaarde >= 0 ? '#10B981' : '#EF4444', icon: werkelijkOverwaarde >= 0 ? '✅' : '⚠️' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-base shrink-0">{row.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>{row.label}</p>
                  {'sub' in row && row.sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{row.sub}</p>}
                </div>
              </div>
              <p className="text-base font-black shrink-0" style={{ color: row.color }}>{formatCurrency(row.value)}</p>
            </div>
          ))}
        </div>

        {/* Divider + nominal overwaarde */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#374151' }}>Nominale overwaarde</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Alleen aankoopprijs vs. marktwaarde</p>
            </div>
            <p className="text-base font-bold" style={{ color: nominaalOverwaarde >= 0 ? '#3B82F6' : '#EF4444' }}>
              {formatCurrency(nominaalOverwaarde)}
            </p>
          </div>
          <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: '#F8FAF9', color: '#6B7280' }}>
            De <strong>nominale overwaarde</strong> is wat je huis meer waard is dan wat je hebt betaald. De <strong>werkelijke overwaarde</strong> houdt ook rekening met alle verbouwingen en onderhoudskosten die je erin hebt gestopt.
          </div>
        </div>
      </div>
    </div>
  );
}

type ChartMode = 'kwartaal' | 'jaarlijks' | 'yoy' | 'since';

interface ChartPoint { label: string; xLabel: string; value: number; up: boolean }

function MarketChart({
  quarterlyData,
  yearlyData,
  purchaseDate,
  projectStartDate,
  isFallback,
  latestPeriod,
  mortgageRate,
  onRefresh,
  refreshing,
}: {
  quarterlyData: QuarterPoint[];
  yearlyData: YearPoint[];
  purchaseDate?: string | null;
  projectStartDate?: string | null;
  isFallback: boolean;
  latestPeriod: string;
  mortgageRate: MortgageRate | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [mode, setMode] = useState<ChartMode>('kwartaal');

  // Reference for 'since' mode
  const refDateStr = projectStartDate || purchaseDate;
  const refYear    = refDateStr ? new Date(refDateStr).getFullYear() : null;
  const refLabel   = projectStartDate
    ? `eerste project (${refYear})`
    : purchaseDate ? `aankoop (${refYear})` : null;

  // Build chart points
  const buildPoints = (): ChartPoint[] => {
    if (mode === 'kwartaal') {
      return quarterlyData.map((q, i) => {
        const prev = quarterlyData[i - 1];
        const up   = !prev || q.index >= prev.index;
        return {
          label:  q.index.toFixed(0),
          xLabel: `Q${q.quarter}'${String(q.year).slice(2)}`,
          value:  q.index,
          up,
        };
      });
    }

    if (mode === 'jaarlijks') {
      return yearlyData.map((d, i) => {
        const prev = yearlyData[i - 1];
        const up   = !prev || d.index >= prev.index;
        return { label: d.index.toFixed(0), xLabel: String(d.year), value: d.index, up };
      });
    }

    if (mode === 'yoy') {
      return yearlyData.slice(1).map((d, i) => {
        const prev = yearlyData[i];
        const pct  = ((d.index - prev.index) / prev.index) * 100;
        return {
          label:  `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
          xLabel: String(d.year),
          value:  pct,
          up:     pct >= 0,
        };
      });
    }

    // since
    const baseYear = yearlyData.reduce((best, d) =>
      Math.abs(d.year - (refYear ?? 0)) < Math.abs(best.year - (refYear ?? 0)) ? d : best,
      yearlyData[0]);
    return yearlyData
      .filter((d) => d.year >= (baseYear?.year ?? 0))
      .map((d) => {
        const pct = ((d.index - baseYear.index) / baseYear.index) * 100;
        return {
          label:  `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
          xLabel: String(d.year),
          value:  pct,
          up:     pct >= 0,
        };
      });
  };

  const points = buildPoints();
  if (points.length === 0) return null;

  const values  = points.map((p) => p.value);
  const isIndex = mode === 'kwartaal' || mode === 'jaarlijks';
  const minVal  = isIndex ? Math.min(...values) * 0.92 : Math.min(0, ...values);
  const maxVal  = Math.max(...values);
  const range   = (maxVal - minVal) || 1;

  const last         = points[points.length - 1];
  const growthPos    = last.up;
  const summaryLabel = mode === 'kwartaal'
    ? `Stijging afgelopen ${points.length} kwartalen`
    : mode === 'jaarlijks'
    ? `Stijging ${yearlyData[0]?.year}–${yearlyData[yearlyData.length - 1]?.year}`
    : mode === 'yoy'
    ? `Groei in ${last.xLabel}`
    : `Totale groei since ${refLabel}`;

  // Latest quarter label
  const [latestYr, latestQ] = latestPeriod.includes('-Q')
    ? latestPeriod.split('-Q')
    : [latestPeriod.slice(0, 4), ''];
  const latestLabel = latestQ ? `Q${latestQ} ${latestYr}` : latestPeriod;

  const availableModes: { id: ChartMode; label: string }[] = [
    { id: 'kwartaal',  label: 'Per kwartaal' },
    { id: 'jaarlijks', label: 'Per jaar' },
    { id: 'yoy',       label: '% per jaar' },
    ...(refYear ? [{ id: 'since' as ChartMode, label: `Sinds ${refYear}` }] : []),
  ];

  return (
    <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Header + live badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Huizenmarkt ontwikkeling</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isFallback ? '#F59E0B' : '#10B981',
                boxShadow: isFallback ? 'none' : '0 0 0 3px rgba(16,185,129,0.2)',
              }}
            />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              {isFallback ? 'Schattingsdata' : `Eurostat · ${latestLabel}`}
            </span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-colors hover:bg-gray-50 disabled:opacity-40"
          style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
        >
          <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Herlaad
        </button>
      </div>

      {/* Mortgage rate chip */}
      {mortgageRate && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-medium"
          style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hypotheekrente NL: <strong>{mortgageRate.rate}%</strong>
          <span style={{ opacity: 0.7 }}>· {mortgageRate.label} · ECB</span>
        </div>
      )}

      {/* Mode pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {availableModes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: mode === m.id ? '#1a3a2a' : '#F3F4F6',
              color:           mode === m.id ? '#FFFFFF'  : '#6B7280',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-32">
        {points.map((p, i) => {
          const barPct = ((p.value - minVal) / range) * 82 + 8;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <span
                className="text-[9px] font-semibold truncate w-full text-center leading-tight"
                style={{ color: p.up ? '#288760' : '#EF4444' }}
              >
                {p.label}
              </span>
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height:          `${Math.max(barPct, 3)}%`,
                  backgroundColor: p.up ? '#288760' : '#EF4444',
                  opacity:         0.85,
                }}
              />
              <span className="text-[9px] truncate w-full text-center" style={{ color: '#9CA3AF' }}>
                {p.xLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <p className="text-xs mt-3 pt-3 border-t" style={{ color: '#6B7280', borderColor: '#F3F4F6' }}>
        {summaryLabel}:{' '}
        <strong style={{ color: growthPos ? '#288760' : '#EF4444' }}>
          {last.label}
        </strong>
        {mode === 'since' && refLabel && (
          <span style={{ color: '#9CA3AF' }}> · t.o.v. {refLabel}</span>
        )}
      </p>
    </div>
  );
}

export default function WoningwaardeClient({ house, totalInvested, isPro, projectStartDate }: Props) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    if (!house?.purchase_price && !house?.purchase_date) {
      setLoadingMarket(true);
      setMarketError(null);
      try {
        const res = await fetch('/api/woningwaarde');
        if (!res.ok) throw new Error('API fout');
        setMarketData(await res.json());
      } catch {
        setMarketError('Marktdata tijdelijk niet beschikbaar.');
      } finally {
        setLoadingMarket(false);
      }
      return;
    }
    setLoadingMarket(true);
    setMarketError(null);
    try {
      const params = new URLSearchParams();
      if (house.purchase_price) params.set('purchase_price', String(house.purchase_price));
      if (house.purchase_date) params.set('purchase_date', house.purchase_date);
      const res = await fetch(`/api/woningwaarde?${params}`);
      if (!res.ok) throw new Error('API fout');
      setMarketData(await res.json());
    } catch {
      setMarketError('Marktdata tijdelijk niet beschikbaar.');
    } finally {
      setLoadingMarket(false);
    }
  };

  useEffect(() => {
    if (isPro) fetchMarketData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, house?.id]);

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-28 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Woningwaarde</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Geschatte marktwaarde en overwaarde berekening</p>
        </div>

        {/* Blurred preview */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="space-y-4 blur-sm pointer-events-none select-none" aria-hidden>
            <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs text-gray-400 mb-2">Geschatte marktwaarde</p>
              <p className="text-3xl font-black text-gray-300">€ ——.———</p>
              <p className="text-sm text-gray-300 mt-1">Bandbreedte: € ——.——— — € ——.———</p>
            </div>
            <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB' }}>
              <div className="space-y-3">
                {['Geschatte marktwaarde', 'Werkelijke investering', 'Werkelijke overwaarde'].map((l) => (
                  <div key={l} className="flex justify-between py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-300">{l}</p>
                    <p className="text-base font-black text-gray-300">€ ——.———</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(to bottom, rgba(248,250,249,0.3), rgba(248,250,249,0.95))' }}>
            <div className="text-center px-6 py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #1a5140, #288760)' }}>🏠</div>
              <h2 className="text-xl font-black mb-2" style={{ color: '#1A1A1A' }}>Pro functie</h2>
              <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#6B7280' }}>
                Woningwaarde inclusief CBS marktdata, overwaarde berekening en markt­ontwikkeling is beschikbaar in Renofloww Pro.
              </p>
              <Link
                href="/settings#abonnement"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1a5140, #288760)', boxShadow: '0 4px 16px rgba(40,135,96,0.35)' }}
              >
                ⭐ Upgrade naar Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-28 md:pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Woningwaarde</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Geschatte marktwaarde en overwaarde berekening</p>
      </div>

      {/* ── House profile ──────────────────────────────────────────── */}
      {!house ? (
        <div className="rounded-2xl p-6 text-center border-2 border-dashed" style={{ borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' }}>
          <div className="text-4xl mb-3">🏠</div>
          <h3 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>Woning profiel ontbreekt</h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
            Stel je woning in via Woningkosten om een waardeschatting te krijgen.
          </p>
          <Link href="/woningkosten" className="px-4 py-2 rounded-xl text-sm font-medium text-white inline-block" style={{ backgroundColor: '#288760' }}>
            Naar Woningkosten
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: '#F0FDF4' }}>🏠</div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{house.address || 'Mijn woning'}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {house.postcode && <span className="text-xs" style={{ color: '#6B7280' }}>📍 {house.postcode}</span>}
                  {house.woningtype && <span className="text-xs" style={{ color: '#6B7280' }}>🏘️ {WONINGTYPE_LABELS[house.woningtype]}</span>}
                  {house.surface_m2 && <span className="text-xs" style={{ color: '#6B7280' }}>📐 {house.surface_m2} m²</span>}
                  {house.purchase_price && <span className="text-xs" style={{ color: '#6B7280' }}>💰 {formatCurrency(Number(house.purchase_price))}</span>}
                  {house.purchase_date && <span className="text-xs" style={{ color: '#6B7280' }}>📅 {formatDate(house.purchase_date)}</span>}
                </div>
              </div>
            </div>
            <Link href="/woningkosten" className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Bewerken
            </Link>
          </div>
        </div>
      )}

      {/* ── Market value section ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Geschatte marktwaarde</h2>
          <button
            onClick={fetchMarketData}
            disabled={loadingMarket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            <svg className={`w-3.5 h-3.5 ${loadingMarket ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loadingMarket ? 'Laden...' : 'Herbereken'}
          </button>
        </div>

        {loadingMarket && (
          <div className="rounded-2xl p-8 bg-white border text-center" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex gap-1 justify-center mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#288760', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>Marktdata ophalen via CBS...</p>
          </div>
        )}

        {marketError && !loadingMarket && (
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
            {marketError}
          </div>
        )}

        {!loadingMarket && marketData && (
          <>
            {marketData.estimate && house?.purchase_price ? (
              <OverwaardeCard
                estimate={marketData.estimate}
                low={marketData.low!}
                high={marketData.high!}
                totalInvested={totalInvested}
                purchasePrice={Number(house.purchase_price)}
                updatedAt={marketData.latestPeriod}
                source={marketData.source}
                isFallback={marketData.isFallback}
              />
            ) : (
              <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Voeg je aankoopprijs en aankoopdatum toe om een waardeschatting te berekenen.
                </p>
                <div className="mt-3 flex gap-2">
                  {[
                    { label: 'Meest recente index', value: marketData.latestIndex?.toFixed(1) || '—' },
                    { label: 'Periode', value: formatPeriod(marketData.latestPeriod) },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 rounded-xl p-3" style={{ backgroundColor: '#F8FAF9' }}>
                      <p className="text-lg font-black" style={{ color: '#1A1A1A' }}>{s.value}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/woningkosten" className="mt-3 inline-block text-sm font-medium" style={{ color: '#288760' }}>
                  Aankoopprijs instellen →
                </Link>
              </div>
            )}

            {/* Market chart */}
            {(marketData.quarterlyData?.length > 0 || marketData.yearlyData.length > 0) && (
              <div className="mt-4">
                <MarketChart
                  quarterlyData={marketData.quarterlyData ?? []}
                  yearlyData={marketData.yearlyData}
                  purchaseDate={house?.purchase_date}
                  projectStartDate={projectStartDate}
                  isFallback={marketData.isFallback}
                  latestPeriod={marketData.latestPeriod}
                  mortgageRate={marketData.mortgageRate ?? null}
                  onRefresh={fetchMarketData}
                  refreshing={loadingMarket}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
