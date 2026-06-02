'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

// Green palette — darkest to lightest, matches the brand
const GREEN_PALETTE = [
  '#288760',
  '#1A5140',
  '#3EAA7A',
  '#0d5c3a',
  '#52BB8A',
  '#6EC99B',
  '#21694F',
  '#8DD4AC',
  '#B7E5BA',
  '#9CA3AF',
];

export interface KostenItem {
  key: string;
  label: string;
  value: number;
  pct: number;
}

interface Props {
  items: KostenItem[];
  total: number;
  size?: number; // diameter of the donut in px
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
      <p className="font-semibold mb-0.5" style={{ color: '#1A1A1A' }}>{payload[0].name}</p>
      <p style={{ color: '#6B7280' }}>{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function KostenVerdelingDonut({ items, total, size = 140 }: Props) {
  const pieData = items.map((item, i) => ({
    name: item.label,
    value: item.value,
    color: GREEN_PALETTE[i % GREEN_PALETTE.length],
  }));

  const innerR = Math.round(size * 0.30);
  const outerR = Math.round(size * 0.46);

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Totaal in midden */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: Math.round(size * 0.072),
            color: '#9CA3AF',
            fontWeight: 600,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            TOTAAL
          </span>
          <span style={{
            fontSize: Math.round(size * 0.115),
            color: '#1A1A1A',
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: 'center',
            marginTop: 2,
          }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex-1 min-w-0 space-y-2">
        {items.map((item, i) => (
          <div key={item.key} className="flex items-center gap-2">
            <div
              className="rounded-full shrink-0"
              style={{ width: 8, height: 8, backgroundColor: GREEN_PALETTE[i % GREEN_PALETTE.length] }}
            />
            <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>{item.label}</span>
            <span className="text-xs font-semibold shrink-0" style={{ color: '#1A1A1A' }}>
              {formatCurrency(item.value)}
            </span>
            <span className="text-xs shrink-0 tabular-nums" style={{ color: '#9CA3AF', width: 28, textAlign: 'right' }}>
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
