'use client';

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

export default function OverzichtTab({ project, rooms, tasks, expenses, contractors, quotes, onTabChange }: Props) {
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(project.budget) || 0;
  const completedTasks = tasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
  const pendingQuotes = quotes.filter((q) => q.status === 'in_behandeling' || q.status === 'pending').length;

  const quickActions = [
    { label: 'Taak toevoegen', tab: 'taken', icon: '✓' },
    { label: 'Kosten toevoegen', tab: 'kosten', icon: '€' },
    { label: 'Aannemer toevoegen', tab: 'aannemers', icon: '👷' },
  ];

  return (
    <div className="space-y-6">
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
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{completedTasks}/{tasks.length}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Voltooid</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Aannemers</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{contractors.length}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Actief</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Open offertes</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{pendingQuotes}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>In behandeling</p>
        </div>
      </div>

      {/* Project info */}
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

        {/* Quick actions */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Snelle acties</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                onClick={() => onTabChange(action.tab)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: '#B7E5BA' }}>
                  {action.icon}
                </span>
                {action.label}
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent expenses */}
      {expenses.length > 0 && (
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Recente kosten</h3>
            <button onClick={() => onTabChange('kosten')} className="text-xs font-medium" style={{ color: '#288760' }}>
              Alle kosten →
            </button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense) => (
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
    </div>
  );
}
