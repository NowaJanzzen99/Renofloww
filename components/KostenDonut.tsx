'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const CAT_COLORS: Record<string, string> = {
  verbouwing: '#288760', onderhoud: '#3B82F6', reparatie: '#F59E0B',
  tuin: '#10B981', verzekering: '#8B5CF6', energie: '#EC4899',
  belasting: '#6B7280', materiaal: '#F97316', arbeid: '#0EA5E9',
  vergunning: '#6366F1', transport: '#A78BFA', overig: '#94A3B8',
};

interface Props {
  cats: [string, number][];
  total: number;
  size?: number;
}

export function KostenDonut({ cats, total, size = 140 }: Props) {
  const data = cats.map(([cat, val]) => ({ name: cat, value: val }));
  const formatted = new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(total);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="80%"
            dataKey="value"
            strokeWidth={0}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={CAT_COLORS[entry.name] ?? '#94A3B8'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: size * 0.075, color: '#9CA3AF', fontWeight: 600, lineHeight: 1 }}>totaal</span>
        <span style={{ fontSize: size * 0.115, color: '#1A1A1A', fontWeight: 800, lineHeight: 1.2, textAlign: 'center' }}>
          {formatted}
        </span>
      </div>
    </div>
  );
}
