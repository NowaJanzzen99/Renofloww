'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Task, Expense, Profile, Project } from '@/types';

interface Props {
  profile: Profile | null;
  activeProject: Project | null;
  tasks: Task[];
  expenses: Expense[];
}

const MONTH_NAMES = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
const WEEK_LABELS = ['M','D','W','D','V','Z','Z'];

// Local date helper – avoids UTC offset issues from toISOString()
function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StreakClient({ profile, activeProject, tasks, expenses }: Props) {
  const today = localDateStr();

  // ── Activity dates set ──────────────────────────────────────────────────────
  const activeDates = useMemo(() => {
    const s = new Set<string>();
    expenses.forEach((e) => { if (e.created_at) s.add(e.created_at.split('T')[0]); });
    tasks.filter((t) => t.completed_at).forEach((t) => s.add(t.completed_at!.split('T')[0]));
    return s;
  }, [expenses, tasks]);

  // ── Current streak ──────────────────────────────────────────────────────────
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = localDateStr(d);
      if (activeDates.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }, [activeDates]);

  // ── Longest streak ──────────────────────────────────────────────────────────
  const longestStreak = useMemo(() => {
    if (activeDates.size === 0) return 0;
    const sorted = [...activeDates].sort();
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  }, [activeDates]);

  const totalActiveDays = activeDates.size;

  // ── This week (Mon–Sun of current calendar week) ─────────────────────────
  const thisWeek = useMemo(() => {
    const todayDate = new Date();
    const dow = todayDate.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + mondayOffset + i);
      const dateStr = localDateStr(d);
      return {
        label: WEEK_LABELS[i],
        dayNum: d.getDate(),
        dateStr,
        hasActivity: activeDates.has(dateStr),
        isToday: dateStr === today,
        isFuture: dateStr > today,
      };
    });
  }, [activeDates, today]);

  // ── Calendar months ─────────────────────────────────────────────────────────
  const months = useMemo(() => {
    const startDate = activeProject?.start_date;
    const result: {
      year: number;
      month: number;
      days: { date: string | null; hasActivity: boolean; isToday: boolean }[];
    }[] = [];

    const [ty, tm] = today.split('-').map(Number);

    let startYear: number, startMonth: number;
    if (startDate) {
      const [sy, sm] = startDate.split('-').map(Number);
      startYear = sy; startMonth = sm - 1;
    } else {
      startYear = ty; startMonth = tm - 1;
    }

    let cursorYear = startYear;
    let cursorMonth = startMonth;

    while (cursorYear < ty || (cursorYear === ty && cursorMonth <= tm - 1)) {
      const year = cursorYear;
      const month = cursorMonth;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDOW = firstDay.getDay();
      const leadingEmpty = startDOW === 0 ? 6 : startDOW - 1;

      const days: { date: string | null; hasActivity: boolean; isToday: boolean }[] = [];
      for (let i = 0; i < leadingEmpty; i++) days.push({ date: null, hasActivity: false, isToday: false });
      for (let d = 1; d <= lastDay.getDate(); d++) {
        // Use direct string formatting to avoid UTC offset issues
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ date: dateStr, hasActivity: activeDates.has(dateStr), isToday: dateStr === today });
      }
      result.push({ year, month, days });

      cursorMonth++;
      if (cursorMonth > 11) { cursorMonth = 0; cursorYear++; }
    }
    return result.reverse();
  }, [activeProject?.start_date, today, activeDates]);

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = [
    { icon: '🔥', label: 'Eerste dag',  desc: '1 dag actief',        unlocked: totalActiveDays >= 1 },
    { icon: '⚡', label: 'Op dreef',    desc: '3 dagen op rij',      unlocked: longestStreak >= 3 },
    { icon: '💪', label: 'Doorzetter',  desc: '7 dagen op rij',      unlocked: longestStreak >= 7 },
    { icon: '🏆', label: 'Kampioen',    desc: '14 dagen op rij',     unlocked: longestStreak >= 14 },
    { icon: '💎', label: 'Legenda',     desc: '30 dagen op rij',     unlocked: longestStreak >= 30 },
    { icon: '📅', label: 'Actieve maand', desc: '30 actieve dagen', unlocked: totalActiveDays >= 30 },
  ];

  return (
    <div className="min-h-full">
      <style>{`
        @keyframes streak-pulse { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.18);opacity:.38} }
        @keyframes fire-bounce  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.05)} }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 sm:px-6 py-14 sm:py-24 text-center"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #6d28d9 100%)' }}
      >
        {/* Ambient rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full border border-purple-400" style={{ animation: 'streak-pulse 3.5s ease-in-out infinite' }} />
          <div className="absolute w-52 h-52 rounded-full border border-purple-300" style={{ animation: 'streak-pulse 3.5s ease-in-out infinite', animationDelay: '1.75s' }} />
        </div>

        <div className="relative">
          {/* Back link */}
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-purple-300 mb-8 hover:text-purple-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>

          <div className="text-6xl sm:text-8xl mb-3" style={{ animation: 'fire-bounce 2s ease-in-out infinite', filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.7))' }}>
            🔥
          </div>
          <div className="text-8xl sm:text-9xl font-black text-white mb-2" style={{ textShadow: '0 0 40px rgba(167,139,250,0.9)', lineHeight: 1 }}>
            {currentStreak}
          </div>
          <p className="text-lg sm:text-2xl font-semibold text-purple-200 mb-1">
            {currentStreak === 1 ? 'dag op rij actief' : 'dagen op rij actief'}
          </p>
          {currentStreak === 0 && (
            <p className="text-sm text-purple-400 mt-3">Voeg vandaag een taak of kosten toe om je streak te starten! 🚀</p>
          )}
          {profile?.name && (
            <p className="text-xs text-purple-400 mt-4">
              {profile.name.split(' ')[0]}'s bouwstreak
            </p>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'Huidige streak',  value: currentStreak,    emoji: '🔥', accent: '#F97316' },
            { label: 'Langste streak',  value: longestStreak,    emoji: '⭐', accent: '#A855F7' },
            { label: 'Totaal actief',   value: totalActiveDays,  emoji: '📅', accent: '#3B82F6' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-lg border" style={{ borderColor: '#E9D5FF' }}>
              <div className="text-3xl sm:text-5xl font-black" style={{ color: s.accent }}>{s.value}</div>
              <div className="text-xl mt-1">{s.emoji}</div>
              <div className="text-[11px] sm:text-xs font-semibold mt-1.5" style={{ color: '#6B7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Deze week ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border mb-6 sm:mb-8" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#1A1A1A' }}>Deze week</h2>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {thisWeek.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold" style={{ color: '#C4B5FD' }}>{day.label}</span>
                <div
                  className="w-full rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    aspectRatio: '1',
                    backgroundColor: day.isToday
                      ? '#9333EA'
                      : day.hasActivity
                      ? '#A855F7'
                      : day.isFuture
                      ? '#F3F4F6'
                      : '#EDE9FE',
                    boxShadow: day.isToday
                      ? '0 0 16px rgba(147,51,234,0.6)'
                      : day.hasActivity
                      ? '0 0 8px rgba(168,85,247,0.35)'
                      : 'none',
                    opacity: day.isFuture ? 0.35 : 1,
                  }}
                >
                  {(day.hasActivity || day.isToday) && !day.isFuture ? (
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[9px] sm:text-[11px] font-semibold" style={{ color: day.isFuture ? '#9CA3AF' : '#C4B5FD' }}>
                      {day.dayNum}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activiteit kalender ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border mb-6 sm:mb-8" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Activiteit kalender</h2>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EDE9FE' }} />
              <span>Inactief</span>
              <div className="w-3 h-3 rounded-sm ml-2" style={{ backgroundColor: '#A855F7' }} />
              <span>Actief</span>
            </div>
          </div>

          {months.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>
              Stel een startdatum in voor je project om je activiteit te zien.
            </p>
          ) : (
            <div className="space-y-6">
              {months.map(({ year, month, days }) => (
                <div key={`${year}-${month}`}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#7C3AED' }}>
                    {MONTH_NAMES[month]} {year}
                  </p>
                  {/* Day-of-week headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {WEEK_LABELS.map((d, i) => (
                      <div key={i} className="text-center" style={{ fontSize: '8px', color: '#C4B5FD', fontWeight: 600 }}>{d}</div>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        title={day.date ? (() => { const [y,m,d] = day.date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }); })() : ''}
                        className="rounded-sm transition-all duration-200"
                        style={{
                          aspectRatio: '1',
                          backgroundColor: !day.date
                            ? 'transparent'
                            : day.isToday
                            ? '#9333EA'
                            : day.hasActivity
                            ? '#A855F7'
                            : '#EDE9FE',
                          boxShadow: day.isToday
                            ? '0 0 8px rgba(147,51,234,0.6)'
                            : day.hasActivity
                            ? '0 0 4px rgba(168,85,247,0.3)'
                            : 'none',
                          opacity: day.date ? 1 : 0,
                          transform: day.isToday ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Achievements ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: '#1A1A1A' }}>Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div
                key={a.label}
                className="rounded-2xl p-3 sm:p-4 border text-center transition-all duration-200"
                style={{
                  borderColor: a.unlocked ? '#C4B5FD' : '#E5E7EB',
                  backgroundColor: a.unlocked ? '#FAF5FF' : '#F9FAFB',
                  opacity: a.unlocked ? 1 : 0.5,
                  boxShadow: a.unlocked ? '0 2px 12px rgba(147,51,234,0.12)' : 'none',
                }}
              >
                <div
                  className="text-2xl sm:text-3xl mb-1.5"
                  style={{ filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.5)' }}
                >
                  {a.icon}
                </div>
                <p className="text-xs font-bold" style={{ color: a.unlocked ? '#7C3AED' : '#6B7280' }}>
                  {a.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{a.desc}</p>
                {a.unlocked && (
                  <div
                    className="mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
                    style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}
                  >
                    ✓ Behaald!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
