'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project, Expense, ExpenseCategory } from '@/types';

interface Props {
  project: Project;
  initialExpenses: Expense[];
}

const categories: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'materiaal', label: 'Materiaal', emoji: '🧱' },
  { value: 'arbeid', label: 'Arbeid', emoji: '👷' },
  { value: 'vergunning', label: 'Vergunning', emoji: '📋' },
  { value: 'transport', label: 'Transport', emoji: '🚚' },
  { value: 'overig', label: 'Overig', emoji: '📦' },
];

type ModalMode = 'add' | 'edit';

export default function KostenTab({ project, initialExpenses }: Props) {
  const [expenses, setExpenses] = useState(initialExpenses);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('materiaal');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Action state
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('expenses-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `project_id=eq.${project.id}` }, async () => {
        const { data } = await supabase.from('expenses').select('*').eq('project_id', project.id).order('date', { ascending: false });
        if (data) setExpenses(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingExpense(null);
    setDescription('');
    setCategory('materiaal');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setModalMode('edit');
    setEditingExpense(expense);
    setDescription(expense.description);
    setCategory(expense.category as ExpenseCategory);
    setAmount(String(expense.amount));
    setDate(expense.date ?? new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

    if (modalMode === 'edit' && editingExpense) {
      // Update existing
      const { data } = await supabase
        .from('expenses')
        .update({ description, category, amount: parsedAmount, date })
        .eq('id', editingExpense.id)
        .select()
        .single();

      if (data) {
        setExpenses((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      }
    } else {
      // Insert new
      const { data } = await supabase
        .from('expenses')
        .insert({ project_id: project.id, description, category, amount: parsedAmount, date })
        .select()
        .single();

      if (data) {
        setExpenses((prev) => [data, ...prev]);
        // Budget warning
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0) + Number(data.amount);
        const budget = Number(project.budget);
        if (budget > 0 && total >= budget * 0.8) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: 'Budget waarschuwing',
              message: `Je hebt ${Math.round((total / budget) * 100)}% van je budget voor "${project.name}" gebruikt.`,
              type: 'warning',
              link: `/projects/${project.id}`,
            });
          }
        }
      }
    }

    closeModal();
    setLoading(false);
  };

  const deleteExpense = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(project.budget) || 0;
  const percentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetColor = percentage >= 90 ? '#EF4444' : percentage >= 75 ? '#F59E0B' : '#288760';

  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat.value] = expenses.filter((e) => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Kosten ({expenses.length})</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: '#288760' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Kosten toevoegen
        </button>
      </div>

      {/* Budget summary */}
      {budget > 0 && (
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-xs" style={{ color: '#6B7280' }}>Totaal uitgegeven</p>
              <p className="text-lg font-bold" style={{ color: budgetColor }}>{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#6B7280' }}>Van budget</p>
              <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{formatCurrency(budget)}</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: '#E5E7EB' }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: budgetColor }} />
          </div>
          <p className="text-xs text-right" style={{ color: budgetColor }}>{percentage}% gebruikt</p>
        </div>
      )}

      {/* Category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {categories.map((cat) => (
          <div key={cat.value} className="rounded-xl p-3 bg-white border text-center" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-lg mb-1">{cat.emoji}</p>
            <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{cat.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{formatCurrency(categoryTotals[cat.value])}</p>
          </div>
        ))}
      </div>

      {/* Expenses list */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">💰</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Nog geen kosten</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Voeg je eerste uitgave toe.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>Omschrijving</th>
                <th className="text-left px-4 py-3 text-xs font-medium hidden sm:table-cell" style={{ color: '#6B7280' }}>Categorie</th>
                <th className="text-left px-4 py-3 text-xs font-medium hidden md:table-cell" style={{ color: '#6B7280' }}>Datum</th>
                <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>Bedrag</th>
                <th className="px-4 py-3 text-xs font-medium w-20" style={{ color: '#6B7280' }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const cat = categories.find((c) => c.value === expense.category);
                const isConfirmingDelete = confirmDeleteId === expense.id;
                const isDeleting = deletingId === expense.id;

                return (
                  <tr key={expense.id} className="border-b last:border-b-0 group" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-4 py-3" style={{ color: '#1A1A1A' }}>{expense.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs">{cat?.emoji} {cat?.label || expense.category}</span>
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: '#6B7280' }}>
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1A1A1A' }}>
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="px-4 py-3">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            {isDeleting ? '...' : 'Ja'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg text-xs font-medium border"
                            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                          >
                            Nee
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(expense)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                            title="Bewerken"
                            style={{ color: '#6B7280' }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                            title="Verwijderen"
                            style={{ color: '#EF4444' }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2" style={{ borderColor: '#E5E7EB' }}>
                <td className="px-4 py-3 font-semibold" style={{ color: '#1A1A1A' }} colSpan={3}>Totaal</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: '#288760' }}>{formatCurrency(totalExpenses)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
                {modalMode === 'edit' ? 'Kosten bewerken' : 'Kosten toevoegen'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                style={{ color: '#6B7280' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving *</label>
                <input
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bijv. Tegels badkamer"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#288760')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Categorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Bedrag *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                    onFocus={(e) => (e.target.style.borderColor = '#288760')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={loading || !description || !amount}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#288760' }}
                >
                  {loading ? 'Opslaan...' : modalMode === 'edit' ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
