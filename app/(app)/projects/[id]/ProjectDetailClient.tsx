'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project, Room, Task, Contractor, Quote, Expense, ExtraWork } from '@/types';
import OverzichtTab from '@/components/projects/tabs/OverzichtTab';
import RuimtesTab from '@/components/projects/tabs/RuimtesTab';
import TakenTab from '@/components/projects/tabs/TakenTab';
import AannemersTab from '@/components/projects/tabs/AannemersTab';
import OffertesTab from '@/components/projects/tabs/OffertesTab';
import KostenTab from '@/components/projects/tabs/KostenTab';
import MeerwerkTab from '@/components/projects/tabs/MeerwerkTab';
import DocumentenTab from '@/components/projects/tabs/DocumentenTab';
import FotosTab from '@/components/projects/tabs/FotosTab';
import InstellingenTab from '@/components/projects/tabs/InstellingenTab';

const tabs = [
  { id: 'overzicht',    label: 'Overzicht',    icon: '📋' },
  { id: 'ruimtes',      label: 'Ruimtes',      icon: '🏠' },
  { id: 'taken',        label: 'Taken',        icon: '✅' },
  { id: 'aannemers',    label: 'Aannemers',    icon: '👷' },
  { id: 'offertes',     label: 'Offertes',     icon: '💰' },
  { id: 'kosten',       label: 'Kosten',       icon: '💸' },
  { id: 'meerwerk',     label: 'Meerwerk',     icon: '🔧' },
  { id: 'documenten',   label: 'Documenten',   icon: '📄' },
  { id: 'fotos',        label: "Foto's",       icon: '📸' },
  { id: 'instellingen', label: 'Instellingen', icon: '⚙️' },
];

const statusOptions = ['gepland', 'lopend', 'gepauzeerd', 'afgerond'];
const statusLabels: Record<string, string> = {
  gepland: 'Gepland', lopend: 'Lopend', gepauzeerd: 'Gepauzeerd', afgerond: 'Afgerond',
};
const statusColors: Record<string, string> = {
  gepland: '#3B82F6', lopend: '#10B981', gepauzeerd: '#F59E0B', afgerond: '#6B7280',
};

interface Props {
  initialProject: Project;
  initialRooms: Room[];
  initialTasks: Task[];
  initialContractors: Contractor[];
  initialQuotes: (Quote & { contractors?: { name: string } | null })[];
  initialExpenses: Expense[];
  initialExtraWork: (ExtraWork & { contractors?: { name: string } | null })[];
  initialTab?: string;
}

export default function ProjectDetailClient({
  initialProject,
  initialRooms,
  initialTasks,
  initialContractors,
  initialQuotes,
  initialExpenses,
  initialExtraWork,
  initialTab = 'overzicht',
}: Props) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view when switching
  useEffect(() => {
    if (activeTabRef.current && tabScrollRef.current) {
      const container = tabScrollRef.current;
      const btn = activeTabRef.current;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      // Center the active tab
      const targetScroll = btnLeft - containerWidth / 2 + btnWidth / 2;
      container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [activeTab]);

  const totalExpenses = initialExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(project.budget) || 0;
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetPctColor = budgetPercentage >= 90 ? '#FCA5A5' : budgetPercentage >= 75 ? '#FDE68A' : '#B7E5BA';

  const completedTasks = initialTasks.filter(
    (t) => t.status === 'voltooid' || t.status === 'done'
  ).length;
  const pendingQuotes = initialQuotes.filter(
    (q) => q.status === 'in_behandeling' || q.status === 'pending'
  ).length;

  const saveName = async () => {
    if (!nameInput.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .update({ name: nameInput })
      .eq('id', project.id)
      .select()
      .single();
    if (data) setProject(data);
    setEditingName(false);
  };

  const updateStatus = async (status: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', project.id)
      .select()
      .single();
    if (data) setProject(data);
  };

  const headerStats = [
    {
      label: 'Taken voltooid',
      value: `${completedTasks}/${initialTasks.length}`,
      accent: '#B7E5BA',
    },
    {
      label: 'Budget gebruikt',
      value: budget > 0 ? `${budgetPercentage}%` : '—',
      accent: budgetPctColor,
    },
    {
      label: 'Totale kosten',
      value: formatCurrency(totalExpenses),
      accent: '#B7E5BA',
    },
    {
      label: 'Ruimtes',
      value: `${initialRooms.length}`,
      accent: '#B7E5BA',
    },
    ...(pendingQuotes > 0
      ? [{ label: 'Open offertes', value: `${pendingQuotes}`, accent: '#FDE68A' }]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8FAFB' }}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">

          {/* ── Analytics-style dark header card ───────────────────────────── */}
          <div
            className="rounded-2xl p-5 sm:p-7 relative overflow-hidden mb-5"
            style={{
              background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 45%, #1e4d36 100%)',
              boxShadow: '0 8px 32px rgba(13,31,26,0.3)',
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(40,135,96,0.22) 0%, transparent 70%)' }}
            />

            {/* Decorative house outline */}
            <svg
              className="absolute pointer-events-none hidden sm:block"
              style={{ right: '24px', top: '50%', transform: 'translateY(-52%)', opacity: 0.055 }}
              width="128" height="128" viewBox="0 0 100 100"
              fill="none" stroke="white" strokeWidth="1.4" strokeLinejoin="round"
            >
              <rect x="14" y="48" width="72" height="46" rx="2" />
              <polyline points="6,48 50,10 94,48" />
              <rect x="38" y="66" width="24" height="28" rx="1" />
              <rect x="18" y="58" width="18" height="18" rx="1" />
              <rect x="64" y="58" width="18" height="18" rx="1" />
              <rect x="62" y="8" width="13" height="26" rx="1" />
            </svg>

            {/* Top row: back link + status */}
            <div className="relative flex items-center justify-between mb-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Mijn projecten
              </Link>

              {/* Status badge + selector */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColors[project.status] || '#6B7280' }}
                />
                <select
                  value={project.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="text-sm font-semibold outline-none cursor-pointer bg-transparent"
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    appearance: 'none',
                    paddingRight: '1rem',
                  }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s} style={{ color: '#1A1A1A', backgroundColor: 'white' }}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
                <svg className="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Label + editable project name */}
            <div className="relative mb-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6EE7B7' }}>
                Project beheer
              </p>

              {editingName ? (
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') { setEditingName(false); setNameInput(project.name); }
                  }}
                  className="text-2xl sm:text-3xl font-black text-white bg-transparent border-b-2 outline-none pb-1 w-full"
                  style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="group flex items-center gap-2 text-left"
                >
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{project.name}</h1>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity text-white flex-shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {project.type
                  ? ({ badkamer: 'Badkamer', keuken: 'Keuken', woonkamer: 'Woonkamer', slaapkamer: 'Slaapkamer', gehele_woning: 'Gehele woning', anders: 'Anders' }[project.type] || project.type.replace(/_/g, ' '))
                  : 'Project'}
                {project.start_date && (
                  <>
                    {' · Gestart '}
                    {new Date(project.start_date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </>
                )}
                {project.end_date && (
                  <>
                    {' · Einddatum '}
                    {new Date(project.end_date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </>
                )}
              </p>
            </div>

            {/* Stats bar (same as analytics) */}
            <div
              className="relative flex flex-wrap gap-5 pt-5 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {headerStats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                  <p className="text-xl font-black" style={{ color: s.accent }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab bar ────────────────────────────────────────────────────── */}
          <div
            className="bg-white rounded-2xl mb-5 relative"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}
          >
            <div
              ref={tabScrollRef}
              className="flex gap-1 overflow-x-auto p-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={active ? activeTabRef : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all shrink-0"
                    style={{
                      backgroundColor: active ? '#288760' : '#F3F4F6',
                      color: active ? '#FFFFFF' : '#6B7280',
                      fontWeight: active ? 600 : 500,
                      boxShadow: active ? '0 2px 8px rgba(40,135,96,0.25)' : 'none',
                    }}
                  >
                    <span className="text-sm leading-none">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scroll fade + animated chevron — mobile only */}
            <style>{`
              @keyframes tab-nudge {
                0%, 100% { transform: translateX(0); opacity: 0.5; }
                50%       { transform: translateX(3px); opacity: 0.9; }
              }
              .tab-chevron { animation: tab-nudge 1.6s ease-in-out 0.8s 3; }
            `}</style>
            <div
              className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pointer-events-none md:hidden rounded-r-2xl"
              style={{ background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.7) 40%, white 75%)', width: '52px' }}
            >
              <svg className="tab-chevron w-5 h-5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────────────── */}
          {activeTab === 'overzicht' && (
            <OverzichtTab
              project={project}
              rooms={initialRooms}
              tasks={initialTasks}
              expenses={initialExpenses}
              contractors={initialContractors}
              quotes={initialQuotes}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'ruimtes' && (
            <RuimtesTab
              project={project}
              initialRooms={initialRooms}
              initialTasks={initialTasks}
            />
          )}
          {activeTab === 'taken' && (
            <TakenTab
              project={project}
              initialTasks={initialTasks}
              initialRooms={initialRooms}
            />
          )}
          {activeTab === 'aannemers' && (
            <AannemersTab
              project={project}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'offertes' && (
            <OffertesTab
              project={project}
              initialQuotes={initialQuotes}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'kosten' && (
            <KostenTab
              project={project}
              initialExpenses={initialExpenses}
            />
          )}
          {activeTab === 'meerwerk' && (
            <MeerwerkTab
              project={project}
              initialExtraWork={initialExtraWork}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'documenten' && (
            <DocumentenTab project={project} />
          )}
          {activeTab === 'fotos' && (
            <FotosTab
              project={project}
              initialRooms={initialRooms}
            />
          )}
          {activeTab === 'instellingen' && (
            <InstellingenTab
              project={project}
              onProjectUpdated={(updated) => {
                setProject(updated);
                setNameInput(updated.name);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
