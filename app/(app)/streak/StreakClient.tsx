'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import type { Task, Expense, Profile, Project } from '@/types';

interface Props {
  profile: Profile | null;
  activeProject: Project | null;
  tasks: Task[];
  expenses: Expense[];
}

const WEEK_LABELS = ['M','D','W','D','V','Z','Z'];

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Toast notification for new achievements
function AchievementToast({ achievements, onDone }: { achievements: { icon: string; label: string }[]; onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 500); }, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (achievements.length === 0) return null;
  const a = achievements[0]; // show one at a time
  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 100%)',
        border: '1px solid #7C3AED',
        boxShadow: '0 8px 32px rgba(109,40,217,0.5)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        opacity: visible ? 1 : 0,
        maxWidth: 300,
      }}
    >
      <div className="text-2xl" style={{ animation: 'bounceIn 0.5s cubic-bezier(.68,-0.55,.27,1.55)' }}>{a.icon}</div>
      <div>
        <p className="text-xs font-bold" style={{ color: '#C4B5FD' }}>Prestatie behaald!</p>
        <p className="text-sm font-black text-white">{a.label}</p>
      </div>
    </div>
  );
}

export default function StreakClient({ profile, activeProject, tasks, expenses }: Props) {
  const today = localDateStr();
  const [newlyUnlocked, setNewlyUnlocked] = useState<{ icon: string; label: string }[]>([]);
  const [toastQueue, setToastQueue] = useState<{ icon: string; label: string }[]>([]);

  // ── Activity dates ──────────────────────────────────────────────────────────
  const activeDates = useMemo(() => {
    const s = new Set<string>();
    // Use expense date (not created_at) for accurate date tracking
    expenses.forEach((e) => {
      const d = e.date || (e.created_at ? e.created_at.split('T')[0] : null);
      if (d) s.add(d);
    });
    tasks.filter((t) => t.completed_at).forEach((t) => s.add(t.completed_at!.split('T')[0]));
    return s;
  }, [expenses, tasks]);

  // ── Current streak (with grace period: streak remains if active yesterday but not yet today) ──
  const currentStreak = useMemo(() => {
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return localDateStr(d);
    })();
    // Start counting from today if active, otherwise from yesterday (grace period)
    const startDate = activeDates.has(today) ? today : activeDates.has(yesterday) ? yesterday : null;
    if (!startDate) return 0;
    let streak = 0;
    const d = new Date(startDate.split('-').join('/'));
    while (activeDates.has(localDateStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [activeDates, today]);

  // ── Longest streak ──────────────────────────────────────────────────────────
  const longestStreak = useMemo(() => {
    if (activeDates.size === 0) return 0;
    const sorted = [...activeDates].sort();
    let longest = 1, current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round(
        (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
      );
      if (diff === 1) { current++; longest = Math.max(longest, current); }
      else current = 1;
    }
    return longest;
  }, [activeDates]);

  const totalActiveDays = activeDates.size;

  // ── This week ───────────────────────────────────────────────────────────────
  const thisWeek = useMemo(() => {
    const todayDate = new Date();
    const dow = todayDate.getDay();
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

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = useMemo(() => [
    { icon: '🔥', label: 'Eerste dag',     desc: '1 dag actief geweest',         unlocked: totalActiveDays >= 1 },
    { icon: '⚡', label: 'Op dreef',       desc: '3 dagen op rij actief',         unlocked: longestStreak >= 3 },
    { icon: '💪', label: 'Doorzetter',     desc: '7 dagen op rij actief',         unlocked: longestStreak >= 7 },
    { icon: '🏆', label: 'Kampioen',       desc: '14 dagen op rij actief',        unlocked: longestStreak >= 14 },
    { icon: '💎', label: 'Legenda',        desc: '30 dagen op rij actief',        unlocked: longestStreak >= 30 },
    { icon: '📅', label: 'Actieve maand',  desc: '30 unieke actieve dagen',       unlocked: totalActiveDays >= 30 },
    { icon: '🚀', label: 'Quickstart',     desc: '5 taken voltooid',              unlocked: tasks.filter(t => t.status === 'voltooid' || t.status === 'done').length >= 5 },
    { icon: '💰', label: 'Boekhouder',     desc: '5 kostposten geregistreerd',    unlocked: expenses.length >= 5 },
  ], [totalActiveDays, longestStreak, tasks, expenses]);

  // ── Achievement unlock notification ────────────────────────────────────────
  useEffect(() => {
    try {
      const seenRaw = localStorage.getItem('rf-achievements-seen');
      const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
      const nowUnlocked = achievements.filter(a => a.unlocked).map(a => a.label);
      const justUnlocked = nowUnlocked.filter(l => !seen.includes(l));
      if (justUnlocked.length > 0) {
        const newOnes = achievements.filter(a => justUnlocked.includes(a.label));
        setNewlyUnlocked(newOnes);
        setToastQueue(newOnes);
        localStorage.setItem('rf-achievements-seen', JSON.stringify(nowUnlocked));
      }
    } catch {}
  }, [achievements]);

  const dismissToast = () => {
    setToastQueue(prev => prev.slice(1));
  };

  const streakLabel = currentStreak === 1 ? 'dag op rij actief' : 'dagen op rij actief';

  return (
    <div className="min-h-full">
      <style>{`
        @keyframes streak-pulse { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.18);opacity:.38} }
        @keyframes fire-bounce  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.05)} }
        @keyframes bounceIn     { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.1)} 80%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        @keyframes achievUnlock { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 70%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        .achievement-new { animation: achievUnlock 0.55s cubic-bezier(.68,-0.55,.27,1.55) both; }
      `}</style>

      {/* Achievement toast */}
      {toastQueue.length > 0 && <AchievementToast achievements={toastQueue} onDone={dismissToast} />}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 sm:px-6 py-14 sm:py-24 text-center"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #6d28d9 100%)' }}
      >
        {/* Ambient rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full border border-purple-400 opacity-20" style={{ animation: 'streak-pulse 3.5s ease-in-out infinite' }} />
          <div className="absolute w-52 h-52 rounded-full border border-purple-300 opacity-20" style={{ animation: 'streak-pulse 3.5s ease-in-out infinite', animationDelay: '1.75s' }} />
        </div>

        <div className="relative">
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
          <p className="text-lg sm:text-2xl font-semibold text-purple-200 mb-1">{streakLabel}</p>
          {currentStreak === 0 && (
            <p className="text-sm text-purple-400 mt-3">Voeg vandaag een taak of kosten toe om je streak te starten! 🚀</p>
          )}
          {profile?.name && (
            <p className="text-xs text-purple-400 mt-4">{profile.name.split(' ')[0]}'s bouwstreak</p>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'Huidige streak',  value: currentStreak,   emoji: '🔥', accent: '#F97316' },
            { label: 'Langste streak',  value: longestStreak,   emoji: '⭐', accent: '#A855F7' },
            { label: 'Totaal actief',   value: totalActiveDays, emoji: '📅', accent: '#3B82F6' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-lg border" style={{ borderColor: '#E9D5FF' }}>
              <div className="text-3xl sm:text-5xl font-black" style={{ color: s.accent }}>{s.value}</div>
              <div className="text-xl mt-1">{s.emoji}</div>
              <div className="text-[11px] sm:text-xs font-semibold mt-1.5" style={{ color: '#6B7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Deze week ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border mb-6 sm:mb-8" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#1A1A1A' }}>Deze week</h2>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {thisWeek.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold" style={{ color: '#C4B5FD' }}>{day.label}</span>
                <div
                  className="w-full rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    aspectRatio: '1',
                    backgroundColor: day.isToday ? '#9333EA' : day.hasActivity ? '#A855F7' : day.isFuture ? '#F9FAFB' : '#EDE9FE',
                    boxShadow: day.isToday ? '0 0 16px rgba(147,51,234,0.6)' : day.hasActivity ? '0 0 8px rgba(168,85,247,0.35)' : 'none',
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

          {/* Week summary */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: '#F3F4F6' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {thisWeek.filter(d => d.hasActivity && !d.isFuture).length} van {thisWeek.filter(d => !d.isFuture).length} dagen actief deze week
            </p>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#A855F7' }}>
                <span>🔥</span>
                <span>{currentStreak} {currentStreak === 1 ? 'dag' : 'dagen'} streak</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Prestaties ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Prestaties</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
              {achievements.filter(a => a.unlocked).length}/{achievements.length} behaald
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map((a) => {
              const isNew = newlyUnlocked.some(n => n.label === a.label);
              return (
                <div
                  key={a.label}
                  className={`rounded-2xl p-3 sm:p-4 border text-center transition-all duration-300 ${isNew ? 'achievement-new' : ''}`}
                  style={{
                    borderColor: a.unlocked ? '#C4B5FD' : '#E5E7EB',
                    backgroundColor: a.unlocked ? '#FAF5FF' : '#F9FAFB',
                    opacity: a.unlocked ? 1 : 0.45,
                    boxShadow: a.unlocked ? '0 2px 16px rgba(147,51,234,0.15)' : 'none',
                    transform: a.unlocked ? 'none' : 'scale(0.97)',
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl mb-1.5"
                    style={{
                      filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                      ...(isNew ? { animation: 'bounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0.1s both' } : {}),
                    }}
                  >
                    {a.icon}
                  </div>
                  <p className="text-xs font-bold leading-tight" style={{ color: a.unlocked ? '#7C3AED' : '#9CA3AF' }}>
                    {a.label}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#9CA3AF' }}>{a.desc}</p>
                  {a.unlocked ? (
                    <div className="mt-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
                      {isNew ? '🎉 Nieuw!' : '✓ Behaald'}
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] px-1.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                      Vergrendeld
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
