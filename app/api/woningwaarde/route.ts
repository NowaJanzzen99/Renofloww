import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for 24 hours
let cache: {
  indices: { period: string; index: number }[];
  fetchedAt: number;
} | null = null;

// Fallback indices (CBS 2015=100 baseline, approximate values)
// Updated to include 2025 annual average; used when CBS API is unreachable
const FALLBACK_INDICES = [
  { period: '2019JJ00', index: 120.7 },
  { period: '2020JJ00', index: 130.4 },
  { period: '2021JJ00', index: 157.0 },
  { period: '2022JJ00', index: 173.2 },
  { period: '2023JJ00', index: 167.8 },
  { period: '2024JJ00', index: 182.4 },
  { period: '2025JJ00', index: 196.1 },
  { period: '2026KW01', index: 202.3 },
];

function periodToDate(period: string): Date {
  const year = parseInt(period.substring(0, 4));
  if (period.includes('KW')) {
    const q = parseInt(period.charAt(6));
    return new Date(year, q * 3 - 2, 1);
  }
  if (period.includes('MM')) {
    const month = parseInt(period.substring(6, 8)) - 1;
    return new Date(year, month, 15);
  }
  return new Date(year, 6, 1); // JJ00 = mid-year
}

async function fetchCBSIndices(): Promise<{ period: string; index: number }[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < 24 * 60 * 60 * 1000) {
    return cache.indices;
  }

  try {
    const url =
      'https://opendata.cbs.nl/ODataApi/odata/83625NED/TypedDataSet' +
      '?$select=Perioden,PrijsindexBestaandeKoopwoningen_1' +
      '&$filter=PrijsindexBestaandeKoopwoningen_1%20ne%20null' +
      '&$orderby=Perioden%20desc&$top=40';

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`CBS status ${res.status}`);

    const json = await res.json();
    const indices: { period: string; index: number }[] = (json.value ?? [])
      .filter((d: Record<string, unknown>) => d.PrijsindexBestaandeKoopwoningen_1 != null)
      .map((d: Record<string, unknown>) => ({
        period: String(d.Perioden).trim(),
        index: parseFloat(String(d.PrijsindexBestaandeKoopwoningen_1)),
      }));

    if (indices.length > 0) {
      cache = { indices, fetchedAt: now };
      return indices;
    }
    throw new Error('Empty CBS response');
  } catch {
    // Use fallback data — don't cache so we retry on next request
    return [...FALLBACK_INDICES].reverse(); // desc order
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const purchaseDateStr = searchParams.get('purchase_date');
  const purchasePriceStr = searchParams.get('purchase_price');

  const indices = await fetchCBSIndices();

  if (indices.length === 0) {
    return NextResponse.json({ error: 'Geen marktdata beschikbaar' }, { status: 503 });
  }

  // Latest index (indices sorted desc)
  const latest = indices[0];
  let estimate: number | null = null;
  let low: number | null = null;
  let high: number | null = null;
  let purchaseIndexValue: number | null = null;

  if (purchaseDateStr && purchasePriceStr) {
    const purchaseDate = new Date(purchaseDateStr);
    const purchasePrice = parseFloat(purchasePriceStr);

    if (!isNaN(purchasePrice) && !isNaN(purchaseDate.getTime())) {
      // Find the index closest to purchase_date
      const best = [...indices]
        .map((idx) => ({
          ...idx,
          diff: Math.abs(periodToDate(idx.period).getTime() - purchaseDate.getTime()),
        }))
        .sort((a, b) => a.diff - b.diff)[0];

      if (best && best.index > 0 && latest.index > 0) {
        purchaseIndexValue = best.index;
        const ratio = latest.index / best.index;
        estimate = Math.round(purchasePrice * ratio);
        low = Math.round(estimate * 0.93);
        high = Math.round(estimate * 1.07);
      }
    }
  }

  // Build yearly chart data (last 6 years of annual records)
  const yearlyData = [...indices]
    .reverse() // asc
    .filter((idx) => idx.period.includes('JJ'))
    .slice(-6)
    .map((idx) => ({
      year: parseInt(idx.period.substring(0, 4)),
      index: idx.index,
    }));

  const usedFallback = cache === null;

  return NextResponse.json({
    estimate,
    low,
    high,
    latestPeriod: latest.period,
    latestIndex: latest.index,
    purchaseIndex: purchaseIndexValue,
    yearlyData,
    source: 'CBS StatLine – Prijsindex bestaande koopwoningen (83625NED)',
    isFallback: usedFallback,
    fetchedAt: cache ? new Date(cache.fetchedAt).toISOString() : new Date().toISOString(),
  });
}
