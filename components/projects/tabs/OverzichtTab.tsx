'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project, Room, Task, Expense, Contractor, Quote } from '@/types';

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

export default function OverzichtTab({ project, rooms, tasks, expenses, contractors, quotes, onTabChange }: Props) {
  const [openModal, setOpenModal] = useState<ModalType>(null);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Budget gebruikt</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>
            {budget > 0 ? `${Math.min(Math.round((totalExpenses / budget) * 100), 100)}%` : '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{formatCurrency(totalExpenses)} van {formatCurrency(budget)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Taken</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{completedTasks}/{taskCount}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Voltooid</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Aannemers</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{contractorCount}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Actief</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Open offertes</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{pendingQuotes}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>In behandeling</p>
        </div>
      </div>

      {/* Project info + quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Project informatie</h3>
          <dl className="space-y-3">
            {[
              { label: 'Type', value: project.type?.charAt(0).toUpperCase() + (project.type?.slice(1) || '') },
              { label: 'Status', value: project.status },
              { label: 'Startdatum', value: formatDate(project.start_date) },
              { label: 'Einddatum', value: formatDate(project.end_date) },
              { label: 'Ruimtes', value: rooms.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm" style={{ color: '#6B7280' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Quick actions — open modals directly */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Snelle acties</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50 active:bg-gray-100"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>
                  {action.icon}
                </span>
                {action.label}
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))}
            <button
              onClick={() => onTabChange('taken')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50 text-left"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F3F4F6' }}>
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
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Recente kosten</h3>
            <button onClick={() => onTabChange('kosten')} className="text-xs font-medium" style={{ color: '#288760' }}>
              Alle kosten →
            </button>
          </div>
          <div className="space-y-2">
            {localExpenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm" style={{ color: '#1A1A1A' }}>{expense.description}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{expense.category} · {expense.date}</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{formatCurrency(Number(expense.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick-add modals ── */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

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
                  <div className="grid grid-cols-2 gap-3">
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
