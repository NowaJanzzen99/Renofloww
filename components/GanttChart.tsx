'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Room } from '@/types';

interface Props {
  rooms: Room[];
  projectStart: string | null;
  projectEnd: string | null;
  compact?: boolean;
  onRoomsUpdated?: (rooms: Room[]) => void;
}

const ROOM_COLORS = [
  '#288760', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

// ── Edit-dates modal ─────────────────────────────────────────────────────────
function EditRoomModal({
  room,
  colorIndex,
  onClose,
  onSaved,
}: {
  room: Room;
  colorIndex: number;
  onClose: () => void;
  onSaved: (updated: Room) => void;
}) {
  const [startDate, setStartDate] = useState(room.start_date || '');
  const [endDate, setEndDate] = useState(room.end_date || '');
  const [color, setColor] = useState(room.color || ROOM_COLORS[colorIndex % ROOM_COLORS.length]);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('rooms')
      .update({ start_date: startDate || null, end_date: endDate || null, color: color || null })
      .eq('id', room.id)
      .select()
      .single();
    if (data) onSaved(data);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Datum instellen — {room.name}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A1A1A' }}>Startdatum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => (e.target.style.borderColor = '#288760')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#1A1A1A' }}>Einddatum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => (e.target.style.borderColor = '#288760')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>Kleur</label>
            <div className="flex gap-2 flex-wrap">
              {ROOM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#1A1A1A' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Annuleren
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main GanttChart component ──────────────────────────────────────────────────
export default function GanttChart({ rooms: initialRooms, projectStart, projectEnd, compact = false, onRoomsUpdated }: Props) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingIndex, setEditingIndex] = useState(0);

  // Determine timeline bounds
  const scheduledRooms = rooms.filter((r) => r.start_date && r.end_date);

  const allStarts = [
    ...(projectStart ? [projectStart] : []),
    ...scheduledRooms.map((r) => r.start_date!),
  ];
  const allEnds = [
    ...(projectEnd ? [projectEnd] : []),
    ...scheduledRooms.map((r) => r.end_date!),
  ];

  const timelineStart = allStarts.length > 0 ? allStarts.reduce((a, b) => (a < b ? a : b)) : null;
  const timelineEnd = allEnds.length > 0 ? allEnds.reduce((a, b) => (a > b ? a : b)) : null;

  const handleRoomSaved = (updated: Room) => {
    const next = rooms.map((r) => (r.id === updated.id ? updated : r));
    setRooms(next);
    onRoomsUpdated?.(next);
  };

  // If no rooms have dates and compact mode, show placeholder
  if (scheduledRooms.length === 0) {
    if (compact) {
      return (
        <div className="text-center py-6 px-4 rounded-2xl border border-dashed" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl mb-1">📅</p>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#1A1A1A' }}>Geen planning ingesteld</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Stel datums in voor ruimtes om de Gantt-planning te zien.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-12 px-4 rounded-2xl border" style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}>
        <p className="text-3xl mb-3">📅</p>
        <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>Geen planning ingesteld</p>
        <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
          Stel een start- en einddatum in voor elke ruimte om de Gantt-planning te zien.
        </p>
        {rooms.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {rooms.slice(0, 3).map((r, i) => (
              <button
                key={r.id}
                onClick={() => { setEditingRoom(r); setEditingIndex(i); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors hover:bg-white"
                style={{ borderColor: '#288760', color: '#288760' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {r.name}
              </button>
            ))}
            {rooms.length > 3 && (
              <span className="px-3 py-1.5 rounded-xl text-xs" style={{ color: '#9CA3AF' }}>
                + {rooms.length - 3} meer
              </span>
            )}
          </div>
        )}
        {editingRoom && (
          <EditRoomModal
            room={editingRoom}
            colorIndex={editingIndex}
            onClose={() => setEditingRoom(null)}
            onSaved={handleRoomSaved}
          />
        )}
      </div>
    );
  }

  if (!timelineStart || !timelineEnd) return null;

  const totalDays = Math.max(1, daysBetween(timelineStart, timelineEnd));

  // Build week/month tick marks
  const ticks: { label: string; pct: number }[] = [];
  if (!compact) {
    // Add a tick every ~7 days
    const tickCount = Math.min(8, Math.floor(totalDays / 7) + 1);
    for (let i = 0; i <= tickCount; i++) {
      const d = Math.round((i / tickCount) * totalDays);
      const dateStr = addDays(timelineStart, d);
      ticks.push({ label: formatShort(dateStr), pct: (d / totalDays) * 100 });
    }
  } else {
    // Compact: just start and end
    ticks.push({ label: formatShort(timelineStart), pct: 0 });
    ticks.push({ label: formatShort(timelineEnd), pct: 100 });
  }

  // Today marker
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPct =
    todayStr >= timelineStart && todayStr <= timelineEnd
      ? (daysBetween(timelineStart, todayStr) / totalDays) * 100
      : null;

  const rowHeight = compact ? 20 : 28;
  const rowGap = compact ? 6 : 10;
  const labelWidth = compact ? 80 : 120;

  return (
    <div>
      {/* Ticks row */}
      <div className="flex" style={{ paddingLeft: `${labelWidth}px`, marginBottom: '4px', position: 'relative' }}>
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute text-center"
            style={{
              left: `calc(${labelWidth}px + ${tick.pct}%)`,
              transform: tick.pct === 0 ? 'none' : tick.pct === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: compact ? '9px' : '10px',
              color: '#9CA3AF',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {tick.label}
          </div>
        ))}
      </div>

      {/* Chart rows */}
      <div style={{ marginTop: compact ? '16px' : '20px' }}>
        {rooms.map((room, idx) => {
          const color = room.color || ROOM_COLORS[idx % ROOM_COLORS.length];
          const hasSchedule = !!(room.start_date && room.end_date);
          const left = hasSchedule ? (daysBetween(timelineStart, room.start_date!) / totalDays) * 100 : 0;
          const width = hasSchedule
            ? (daysBetween(room.start_date!, room.end_date!) / totalDays) * 100
            : 0;

          return (
            <div
              key={room.id}
              className="flex items-center"
              style={{ marginBottom: `${rowGap}px` }}
            >
              {/* Room label */}
              <div
                className="shrink-0 flex items-center justify-between pr-2"
                style={{ width: `${labelWidth}px` }}
              >
                <span
                  className="truncate font-medium"
                  style={{
                    fontSize: compact ? '10px' : '12px',
                    color: '#374151',
                    maxWidth: `${labelWidth - 28}px`,
                  }}
                  title={room.name}
                >
                  {room.name}
                </span>
                {!compact && (
                  <button
                    onClick={() => { setEditingRoom(room); setEditingIndex(idx); }}
                    className="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-gray-100"
                    title="Datum instellen"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Bar track */}
              <div className="flex-1 relative" style={{ height: `${rowHeight}px` }}>
                {/* Background track */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#F3F4F6' }}
                />

                {/* Today line */}
                {todayPct !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 z-10"
                    style={{ left: `${todayPct}%`, backgroundColor: '#EF4444', opacity: 0.7 }}
                  />
                )}

                {/* Room bar */}
                {hasSchedule ? (
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      backgroundColor: color,
                      boxShadow: `0 2px 8px ${color}40`,
                    }}
                  >
                    {!compact && width > 8 && (
                      <span className="text-white text-[9px] font-bold px-1 truncate">
                        {formatShort(room.start_date!)} – {formatShort(room.end_date!)}
                      </span>
                    )}
                  </div>
                ) : (
                  !compact && (
                    <button
                      onClick={() => { setEditingRoom(room); setEditingIndex(idx); }}
                      className="absolute inset-y-0.5 left-0 right-0 rounded-full border-2 border-dashed flex items-center justify-center transition-colors hover:border-gray-400"
                      style={{ borderColor: '#D1D5DB' }}
                    >
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>+ Datum instellen</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      {todayPct !== null && !compact && (
        <div
          className="relative mt-1"
          style={{ paddingLeft: `${labelWidth}px` }}
        >
          <div
            className="absolute text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              left: `calc(${labelWidth}px + ${todayPct}%)`,
              transform: 'translateX(-50%)',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              fontSize: '9px',
              whiteSpace: 'nowrap',
            }}
          >
            Vandaag
          </div>
        </div>
      )}

      {/* Legend (non-compact only) */}
      {!compact && (
        <div className="mt-6 flex items-center gap-4 flex-wrap">
          {rooms.filter((r) => r.start_date && r.end_date).map((room, idx) => {
            const color = room.color || ROOM_COLORS[idx % ROOM_COLORS.length];
            return (
              <div key={room.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs" style={{ color: '#6B7280' }}>{room.name}</span>
              </div>
            );
          })}
          {todayPct !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-red-400" />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Vandaag</span>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          colorIndex={editingIndex}
          onClose={() => setEditingRoom(null)}
          onSaved={handleRoomSaved}
        />
      )}
    </div>
  );
}
