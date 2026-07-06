'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PROJECT_TYPE_LABEL } from '@/lib/projectTypes';
import type { Project, Room, Task, Expense, Contractor, Quote } from '@/types';
import GanttChart from '@/components/GanttChart';

interface Props {
  project: Project;
  rooms: Room[];
  tasks: Task[];
  expenses: Expense[];
  contractors: Contractor[];
  quotes: (Quote & { contractors?: { name: string } | null })[];
  onTabChange: (tab: string) => void;
}

const expenseCategories = [
  { value: 'materiaal', label: 'Materiaal' },
  { value: 'arbeid', label: 'Arbeid' },
  { value: 'vergunning', label: 'Vergunning' },
  { value: 'transport', label: 'Transport' },
  { value: 'overig', label: 'Overig' },
];

type ModalType = 'task' | 'expense' | 'contractor' | null;

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function OverzichtTab({ project, rooms: initialRooms, tasks, expenses, contractors, quotes, onTabChange }: Props) {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  // Scroll to planning section when navigated from dashboard with #planning hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#planning') {
      setTimeout(() => {
        document.getElementById('planning')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, []);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local counts that optimistically update after quick-add
  const [taskCount, setTaskCount] = useState(tasks.length);
  const [contractorCount, setContractorCount] = useState(contractors.length);
  const [localExpenses, setLocalExpenses] = useState(expenses);

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Expense form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('materiaal');
  const [expDate, setExpDate] = useState(localDateStr());

  // Contractor form
  const [conName, setConName] = useState('');
  const [conType, setConType] = useState('');

  const totalExpenses = localExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(project.budget) || 0;
  const completedTasks = tasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
  const pendingQuotes = quotes.filter((q) => q.status === 'in_behandeling' || q.status === 'pending').length;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const openModalFor = (type: ModalType) => {
    setOpenModal(type);
    // Reset forms
    setTaskTitle(''); setTaskDueDate('');
    setExpDesc(''); setExpAmount(''); setExpCategory('materiaal'); setExpDate(localDateStr());
    setConName(''); setConType('');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase.from('tasks').insert({
      project_id: project.id,
      title: taskTitle.trim(),
      status: 'openstaand',
      due_date: taskDueDate || null,
    }).select().single();
    if (data) {
      setTaskCount((n) => n + 1);
      showSuccess('Taak toegevoegd ✓');
    }
    setSaving(false);
    setOpenModal(null);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase.from('expenses').insert({
      project_id: project.id,
      description: expDesc.trim(),
      amount: parseFloat(expAmount.replace(/\./g, '').replace(',', '.')),
      category: expCategory,
      date: expDate,
    }).select().single();
    if (data) {
      setLocalExpenses((prev) => [data, ...prev]);
      showSuccess('Kosten toegevoegd ✓');
    }
    setSaving(false);
    setOpenModal(null);
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase.from('contractors').insert({
      project_id: project.id,
      name: conName.trim(),
      type: conType || null,
    }).select().single();
    if (data) {
      setContractorCount((n) => n + 1);
      showSuccess('Aannemer toegevoegd ✓');
    }
    setSaving(false);
    setOpenModal(null);
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none';
  const inputStyle = { borderColor: '#E5E7EB', color: '#1A1A1A' };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#288760');
  const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#E5E7EB');

  const quickActions = [
    {
      label: 'Taak toevoegen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      onClick: () => openModalFor('task'),
    },
    {
      label: 'Kosten toevoegen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => openModalFor('expense'),
    },
    {
      label: 'Aannemer toevoegen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => openModalFor('contractor'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMsg && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ backgroundColor: '#288760', transition: 'all 0.2s' }}
        >
          {successMsg}
        </div>
      )}

      {/* Summary cards */}
      {(() => {
        const budgetPct = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
        const budgetAccent = budgetPct >= 90 ? '#EF4444' : budgetPct >= 75 ? '#F59E0B' : '#288760';
        const cards = [
          {
            label: 'Budget gebruikt',
            value: budget > 0 ? `${budgetPct}%` : '—',
            sub: `${formatCurrency(totalExpenses)} van ${formatCurrency(budget)}`,
            accent: budgetAccent,
            tab: 'instellingen',
            editable: true,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'Taken voltooid',
            value: `${completedTasks}/${taskCount}`,
            sub: taskCount > 0 ? `${Math.round((completedTasks / taskCount) * 100)}% klaar` : 'Nog geen taken',
            accent: '#3B82F6',
            tab: 'taken',
            editable: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ),
          },
          {
            label: 'Open offertes',
            value: `${pendingQuotes}`,
            sub: pendingQuotes === 0 ? 'Geen openstaand' : `${pendingQuotes} in behandeling`,
            accent: '#F59E0B',
            tab: 'offertes',
            editable: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
          },
          {
            label: 'Aannemers',
            value: `${contractorCount}`,
            sub: contractorCount === 1 ? '1 actief' : `${contractorCount} actief`,
            accent: '#8B5CF6',
            tab: 'aannemers',
            editable: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          },
        ];
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <button
                key={card.label}
                onClick={() => onTabChange(card.tab)}
                className="text-left rounded-2xl p-4 bg-white border transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                title={card.editable ? 'Bewerk budget in Instellingen' : `Ga naar ${card.label}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
                    <span style={{ color: '#288760' }}>{card.icon}</span>
                  </div>
                  {card.editable && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ color: '#288760', backgroundColor: '#F0FDF4' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Wijzig
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black mb-0.5" style={{ color: card.label === 'Budget gebruikt' ? card.accent : '#1A1A1A' }}>{card.value}</p>
                <p className="text-xs font-medium mb-0.5" style={{ color: '#6B7280' }}>{card.label}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{card.sub}</p>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Project info + quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B7E5BA' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A5140' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Project informatie</h3>
          </div>
          {(() => {
            const statusLabels2: Record<string, string> = {
              gepland: 'Gepland', lopend: 'Lopend', gepauzeerd: 'Gepauzeerd', afgerond: 'Afgerond',
            };
            const statusBadgeColors: Record<string, { color: string; bg: string }> = {
              gepland: { color: '#3B82F6', bg: '#EFF6FF' },
              lopend:  { color: '#10B981', bg: '#ECFDF5' },
              gepauzeerd: { color: '#F59E0B', bg: '#FFFBEB' },
              afgerond: { color: '#6B7280', bg: '#F3F4F6' },
            };
            const rows = [
              { label: 'Type', value: PROJECT_TYPE_LABEL[project.type] || project.type?.replace(/_/g, ' ') || '—', badge: null },
              { label: 'Status', value: statusLabels2[project.status] || project.status, badge: statusBadgeColors[project.status] },
              { label: 'Startdatum', value: formatDate(project.start_date) || '—', badge: null },
              { label: 'Einddatum', value: formatDate(project.end_date) || '—', badge: null },
              { label: 'Ruimtes', value: rooms.length.toString(), badge: null },
            ];
            return (
              <dl className="space-y-0">
                {rows.map(({ label, value, badge }, i) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-3"
                    style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}
                  >
                    <dt className="text-sm" style={{ color: '#9CA3AF' }}>{label}</dt>
                    {badge ? (
                      <dd className="text-sm font-semibold px-2.5 py-0.5 rounded-full" style={{ color: badge.color, backgroundColor: badge.bg }}>
                        {value}
                      </dd>
                    ) : (
                      <dd className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{value}</dd>
                    )}
                  </div>
                ))}
              </dl>
            );
          })()}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B7E5BA' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A5140' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Snelle acties</h3>
          </div>
          <div className="space-y-2">
            {quickActions.map((action, idx) => {
              const isPrimary = idx === 0;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.99]"
                  style={isPrimary
                    ? { backgroundColor: '#288760', color: 'white', border: '1px solid #288760', boxShadow: '0 2px 8px rgba(40,135,96,0.25)' }
                    : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }
                  }
                  onMouseEnter={e => {
                    if (isPrimary) { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a6649'; }
                    else { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB'; }
                  }}
                  onMouseLeave={e => {
                    if (isPrimary) { (e.currentTarget as HTMLElement).style.backgroundColor = '#288760'; }
                    else { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={isPrimary ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } : { backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    {action.icon}
                  </span>
                  {action.label}
                  <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: isPrimary ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              );
            })}
            <button
              onClick={() => onTabChange('taken')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
              style={{ backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E5E7EB'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'; }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#E5E7EB' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              Alle taken bekijken
              <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Recent expenses */}
      {localExpenses.length > 0 && (
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B7E5BA' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1A5140' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Recente kosten</h3>
            </div>
            <button onClick={() => onTabChange('kosten')} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: '#288760' }}>
              Alle kosten →
            </button>
          </div>
          <div>
            {localExpenses.slice(0, 5).map((expense, idx) => {
              type CatEntry = { bg: string; text: string; icon: React.ReactNode };
              const catData: Record<string, CatEntry> = {
                materiaal: {
                  bg: '#EFF6FF', text: '#3B82F6',
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
                },
                arbeid: {
                  bg: '#F0FDF4', text: '#16A34A',
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                },
                vergunning: {
                  bg: '#FEF3C7', text: '#D97706',
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                },
                transport: {
                  bg: '#F5F3FF', text: '#7C3AED',
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h2m6-2h-2m2 0l2-4h3l3 4" /></svg>,
                },
                overig: {
                  bg: '#F3F4F6', text: '#6B7280',
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>,
                },
              };
              const cat = catData[expense.category || 'overig'] || catData.overig;
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-3"
                  style={{ borderTop: idx > 0 ? '1px solid #F3F4F6' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.bg, color: cat.text }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{expense.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {expense.category
                          ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1)
                          : 'Overig'}
                        {expense.date ? ` · ${expense.date}` : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#1A1A1A' }}>
                    {formatCurrency(Number(expense.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Gantt planning ── */}
      {rooms.length > 0 && (
        <div id="planning" className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', scrollMarginTop: '80px' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Planning (Gantt)</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Klik het potlood-icoon per ruimte om datums in te stellen</p>
            </div>
          </div>
          <GanttChart
            rooms={rooms}
            projectStart={project.start_date}
            projectEnd={project.end_date}
            compact={false}
            onRoomsUpdated={setRooms}
          />
        </div>
      )}

      {/* ── Quick-add modals ── */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[88dvh] overflow-y-auto">

            {/* ── Task modal ── */}
            {openModal === 'task' && (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
                  <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Taak toevoegen</h2>
                  <button onClick={() => setOpenModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleAddTask} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Taaknaam *</label>
                    <input autoFocus required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Bijv. Badkamer tegels leggen"
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Deadline (optioneel)</label>
                    <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setOpenModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
                    <button type="submit" disabled={saving || !taskTitle.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
                      {saving ? 'Opslaan...' : 'Taak toevoegen'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Expense modal ── */}
            {openModal === 'expense' && (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
                  <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Kosten toevoegen</h2>
                  <button onClick={() => setOpenModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving *</label>
                    <input autoFocus required value={expDesc} onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="Bijv. Tegels woonkamer"
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
                      <input required type="number" min="0" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                        style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Categorie</label>
                      <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
                        className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                        {expenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Datum</label>
                      <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)}
                        className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setOpenModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
                    <button type="submit" disabled={saving || !expDesc.trim() || !expAmount} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
                      {saving ? 'Opslaan...' : 'Kosten toevoegen'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Contractor modal ── */}
            {openModal === 'contractor' && (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
                  <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Aannemer toevoegen</h2>
                  <button onClick={() => setOpenModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleAddContractor} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Naam *</label>
                    <input autoFocus required value={conName} onChange={(e) => setConName(e.target.value)}
                      placeholder="Bijv. Jansen Timmerwerken"
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Type / specialisme (optioneel)</label>
                    <input value={conType} onChange={(e) => setConType(e.target.value)}
                      placeholder="Bijv. Tegelzetter, elektricien..."
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setOpenModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
                    <button type="submit" disabled={saving || !conName.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
                      {saving ? 'Opslaan...' : 'Aannemer toevoegen'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
