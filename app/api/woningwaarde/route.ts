import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuarterPoint { period: string; quarter: number; year: number; index: number }
interface YearPoint    { year: number; index: number }

// ─── Fallback data (Eurostat I15_Q baseline, NL) ─────────────────────────────
const FALLBACK_QUARTERLY: QuarterPoint[] = [
  { period: '2020-Q1', quarter: 1, year: 2020, index: 125.4 },
  { period: '2020-Q2', quarter: 2, year: 2020, index: 127.9 },
  { period: '2020-Q3', quarter: 3, year: 2020, index: 132.1 },
  { period: '2020-Q4', quarter: 4, year: 2020, index: 137.6 },
  { period: '2021-Q1', quarter: 1, year: 2021, index: 145.3 },
  { period: '2021-Q2', quarter: 2, year: 2021, index: 155.8 },
  { period: '2021-Q3', quarter: 3, year: 2021, index: 162.4 },
  { period: '2021-Q4', quarter: 4, year: 2021, index: 167.9 },
  { period: '2022-Q1', quarter: 1, year: 2022, index: 172.1 },
  { period: '2022-Q2', quarter: 2, year: 2022, index: 176.3 },
  { period: '2022-Q3', quarter: 3, year: 2022, index: 174.8 },
  { period: '2022-Q4', quarter: 4, year: 2022, index: 170.2 },
  { period: '2023-Q1', quarter: 1, year: 2023, index: 183.14 },
  { period: '2023-Q2', quarter: 2, year: 2023, index: 180.92 },
  { period: '2023-Q3', quarter: 3, year: 2023, index: 182.91 },
  { period: '2023-Q4', quarter: 4, year: 2023, index: 186.07 },
  { period: '2024-Q1', quarter: 1, year: 2024, index: 189.87 },
  { period: '2024-Q2', quarter: 2, year: 2024, index: 194.81 },
  { period: '2024-Q3', quarter: 3, year: 2024, index: 201.98 },
  { period: '2024-Q4', quarter: 4, year: 2024, index: 206.31 },
  { period: '2025-Q1', quarter: 1, year: 2025, index: 210.27 },
  { period: '2025-Q2', quarter: 2, year: 2025, index: 213.35 },
  { period: '2025-Q3', quarter: 3, year: 2025, index: 217.61 },
  { period: '2025-Q4', quarter: 4, year: 2025, index: 219.01 },
];

// ─── Quarter → approximate date ───────────────────────────────────────────────
function quarterToDate(period: string): Date {
  // "2024-Q3" → ~Aug 1, 2024
  const year = parseInt(period.slice(0, 4));
  const q    = parseInt(period.slice(6));
  return new Date(year, q * 3 - 2, 1);
}

// ─── Eurostat quarterly house price index for NL ──────────────────────────────
async function fetchEurostatHPI(forceFresh: boolean): Promise<{ data: QuarterPoint[]; isFallback: boolean }> {
  try {
    const url =
      'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hpi_q' +
      '?geo=NL&unit=I15_Q&format=JSON';

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(forceFresh ? { cache: 'no-store' as const } : { next: { revalidate: 86400 } }), // CDN cache 24 h, bypassed on manual refresh
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Eurostat ${res.status}`);

    const json = await res.json();
    const timeIndex: Record<string, number> = json.dimension?.time?.category?.index ?? {};
    const values: Record<string, number>    = json.value ?? {};

    const points: QuarterPoint[] = Object.entries(timeIndex)
      .map(([period, idx]) => {
        const val = values[String(idx)];
        if (val == null) return null;
        const year = parseInt(period.slice(0, 4));
        const q    = parseInt(period.slice(6));
        return { period, quarter: q, year, index: val };
      })
      .filter((x): x is QuarterPoint => x !== null)
      .sort((a, b) => a.period.localeCompare(b.period));

    if (points.length > 0) return { data: points, isFallback: false };
    throw new Error('Empty');
  } catch {
    return { data: FALLBACK_QUARTERLY, isFallback: true };
  }
}

// ─── ECB monthly mortgage rate for NL ─────────────────────────────────────────
async function fetchMortgageRate(forceFresh: boolean): Promise<{ rate: number; period: string } | null> {
  try {
    const url =
      'https://data-api.ecb.europa.eu/service/data/MIR/M.NL.B.A2C.AM.R.A.2250.EUR.N' +
      '?format=jsondata&lastNObservations=3';

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(forceFresh ? { cache: 'no-store' as const } : { next: { revalidate: 86400 } }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`ECB ${res.status}`);

    const json = await res.json();
    const times: { id: string }[] =
      json.structure?.dimensions?.observation?.[0]?.values ?? [];
    const seriesValues = Object.values(json.dataSets?.[0]?.series ?? {}) as { observations?: Record<string, number[]> }[];
    const obs: Record<string, number[]> = seriesValues[0]?.observations ?? {};

    const sorted = Object.entries(obs).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    const last   = sorted[sorted.length - 1];
    if (!last) throw new Error('Empty');

    const idx    = parseInt(last[0]);
    const period = times[idx]?.id ?? '';
    const rate   = last[1][0];

    return { rate: Math.round(rate * 100) / 100, period };
  } catch {
    return null;
  }
}

// ─── Compute annual averages from quarterly data ───────────────────────────────
function toYearly(quarters: QuarterPoint[]): YearPoint[] {
  const byYear: Record<number, number[]> = {};
  quarters.forEach((q) => {
    if (!byYear[q.year]) byYear[q.year] = [];
    byYear[q.year].push(q.index);
  });
  return Object.entries(byYear)
    .map(([year, vals]) => ({ year: parseInt(year), index: vals.reduce((a, b) => a + b) / vals.length }))
    .sort((a, b) => a.year - b.year);
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const purchaseDateStr  = searchParams.get('purchase_date');
  const purchasePriceStr = searchParams.get('purchase_price');
  const forceFresh       = searchParams.get('refresh') === '1';

  const [{ data: allQuarters, isFallback }, mortgageResult] = await Promise.all([
    fetchEurostatHPI(forceFresh),
    fetchMortgageRate(forceFresh),
  ]);

  if (allQuarters.length === 0) {
    return NextResponse.json({ error: 'Geen marktdata beschikbaar' }, { status: 503 });
  }

  // Latest quarter (sorted asc, so last element is most recent)
  const latest = allQuarters[allQuarters.length - 1];

  // Estimate house value
  let estimate: number | null = null;
  let low: number | null = null;
  let high: number | null = null;
  let purchaseIndexValue: number | null = null;

  if (purchaseDateStr && purchasePriceStr) {
    const purchaseDate  = new Date(purchaseDateStr);
    const purchasePrice = parseFloat(purchasePriceStr);

    if (!isNaN(purchasePrice) && !isNaN(purchaseDate.getTime())) {
      const best = allQuarters
        .map((q) => ({ ...q, diff: Math.abs(quarterToDate(q.period).getTime() - purchaseDate.getTime()) }))
        .sort((a, b) => a.diff - b.diff)[0];

      if (best && best.index > 0 && latest.index > 0) {
        purchaseIndexValue = best.index;
        const ratio = latest.index / best.index;
        estimate    = Math.round(purchasePrice * ratio);
        low         = Math.round(estimate * 0.93);
        high        = Math.round(estimate * 1.07);
      }
    }
  }

  // Last 12 quarters for chart (3 years of quarterly detail)
  const quarterlyData = allQuarters.slice(-12);

  // Annual averages from full history, last 8 complete years
  const yearlyData = toYearly(allQuarters).slice(-8);

  // Mortgage rate label
  const mortgageRate = mortgageResult
    ? {
        rate:   mortgageResult.rate,
        period: mortgageResult.period,
        label:  (() => {
          const [yr, mo] = mortgageResult.period.split('-');
          const months   = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
          return `${months[parseInt(mo) - 1]} ${yr}`;
        })(),
      }
    : null;

  return NextResponse.json({
    estimate,
    low,
    high,
    latestPeriod:  latest.period,
    latestIndex:   latest.index,
    purchaseIndex: purchaseIndexValue,
    quarterlyData,
    yearlyData,
    mortgageRate,
    source:        'Eurostat (prc_hpi_q) · ECB (MIR)',
    isFallback,
    fetchedAt:     new Date().toISOString(),
  });
}
