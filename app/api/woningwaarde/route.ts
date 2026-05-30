import { NextRequest, NextResponse } from 'next/server';

// Fallback indices (CBS 2015=100 baseline) — only used when both CBS endpoints are unreachable
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

async function getIndices(): Promise<{
  indices: { period: string; index: number }[];
  isFallback: boolean;
}> {
  // Try two CBS endpoints in order. next: { revalidate } uses Next.js Data Cache
  // so the actual HTTP request to CBS happens at most once per 24h across all
  // Vercel instances — no per-instance memory cache needed.
  const endpoints = [
    // OData4 (newer, works better with Vercel's edge network)
    'https://odata4.cbs.nl/CBS/83625NED/Observations' +
      '?$select=Perioden,PrijsindexBestaandeKoopwoningen_1' +
      '&$filter=PrijsindexBestaandeKoopwoningen_1 ne null' +
      '&$orderby=Perioden desc&$top=40',
    // OData3 (original)
    'https://opendata.cbs.nl/ODataApi/odata/83625NED/TypedDataSet' +
      '?$select=Perioden,PrijsindexBestaandeKoopwoningen_1' +
      '&$filter=PrijsindexBestaandeKoopwoningen_1%20ne%20null' +
      '&$orderby=Perioden%20desc&$top=40',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 }, // 24h CDN cache — shared across all Vercel instances
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const raw: Record<string, unknown>[] = json.value ?? [];

      const indices = raw
        .filter((d) => d.PrijsindexBestaandeKoopwoningen_1 != null)
        .map((d) => ({
          period: String(d.Perioden).trim(),
          index: parseFloat(String(d.PrijsindexBestaandeKoopwoningen_1)),
        }))
        .filter((d) => !isNaN(d.index));

      if (indices.length > 0) return { indices, isFallback: false };
    } catch {
      // try next endpoint
    }
  }

  // Both endpoints failed — use hardcoded fallback
  return { indices: [...FALLBACK_INDICES].reverse(), isFallback: true };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const purchaseDateStr = searchParams.get('purchase_date');
  const purchasePriceStr = searchParams.get('purchase_price');

  const { indices, isFallback } = await getIndices();

  if (indices.length === 0) {
    return NextResponse.json({ error: 'Geen marktdata beschikbaar' }, { status: 503 });
  }

  // indices is sorted desc — most recent first
  const latest = indices[0];
  let estimate: number | null = null;
  let low: number | null = null;
  let high: number | null = null;
  let purchaseIndexValue: number | null = null;

  if (purchaseDateStr && purchasePriceStr) {
    const purchaseDate = new Date(purchaseDateStr);
    const purchasePrice = parseFloat(purchasePriceStr);

    if (!isNaN(purchasePrice) && !isNaN(purchaseDate.getTime())) {
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

  // 6 most recent annual records, ascending for the chart
  const yearlyData = [...indices]
    .reverse()
    .filter((idx) => idx.period.includes('JJ'))
    .slice(-6)
    .map((idx) => ({
      year: parseInt(idx.period.substring(0, 4)),
      index: idx.index,
    }));

  return NextResponse.json({
    estimate,
    low,
    high,
    latestPeriod: latest.period,
    latestIndex: latest.index,
    purchaseIndex: purchaseIndexValue,
    yearlyData,
    source: 'CBS StatLine – Prijsindex bestaande koopwoningen (83625NED)',
    isFallback,
    fetchedAt: new Date().toISOString(),
  });
}
