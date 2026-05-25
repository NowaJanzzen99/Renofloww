'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  lopend: { label: 'Lopend', color: '#3B82F6', bg: '#EFF6FF' },
  afgerond: { label: 'Afgerond', color: '#10B981', bg: '#ECFDF5' },
  gepauzeerd: { label: 'Gepauzeerd', color: '#F59E0B', bg: '#FFFBEB' },
  gepland: { label: 'Gepland', color: '#6B7280', bg: '#F9FAFB' },
  active: { label: 'Lopend', color: '#3B82F6', bg: '#EFF6FF' },
};

const typeEmoji: Record<string, string> = {
  badkamer: '🚿',
  keuken: '🍳',
  woonkamer: '🛋️',
  slaapkamer: '🛏️',
  gehele_woning: '🏠',
  anders: '✏️',
};

function ProjectCard({ project }: { project: Project & { total_expenses?: number } }) {
  const status = statusConfig[project.status] || statusConfig.gepland;
  const budget = Number(project.budget) || 0;
  const spent = project.total_expenses || 0;
  const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const budgetColor = percentage >= 90 ? '#EF4444' : percentage >= 75 ? '#F59E0B' : '#288760';

  const daysRemaining = project.end_date
    ? Math.ceil((new Date(project.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-2xl p-5 bg-white border transition-shadow hover:shadow-md"
      style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeEmoji[project.type] || '🏠'}</span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{project.name}</h3>
            {project.start_date && (
              <p className="text-xs" style={{ color: '#6B7280' }}>Start: {formatDate(project.start_date)}</p>
            )}
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Budget progress */}
      {budget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#6B7280' }}>{formatCurrency(spent)} / {formatCurrency(budget)}</span>
            <span style={{ color: budgetColor }}>{percentage}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${percentage}%`, backgroundColor: budgetColor }}
            />
          </div>
        </div>
      )}

      {/* Days remaining chip */}
      {daysRemaining !== null && (
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: daysRemaining < 0 ? '#FEE2E2' : daysRemaining < 7 ? '#FEF3C7' : '#F0FDF4',
            color: daysRemaining < 0 ? '#991B1B' : daysRemaining < 7 ? '#92400E' : '#166534',
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dagen verlopen` : `${daysRemaining} dagen resterend`}
        </div>
      )}
    </Link>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (project: Project) => void }) {
  const [naam, setNaam] = useState('');
  const [type, setType] = useState('badkamer');
  const [budget, setBudget] = useState('');
  const [startDatum, setStartDatum] = useState('');
  const [eindDatum, setEindDatum] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: naam,
          type,
          budget: budget ? parseFloat(budget.replace(',', '.')) : null,
          start_date: startDatum || null,
          end_date: eindDatum || null,
          status: 'lopend',
        })
        .select()
        .single();

      if (insertError) {
        setError('Er is iets misgegaan. Probeer het opnieuw.');
        return;
      }

      onCreated(data);
    } catch {
      setError('Er is een onverwachte fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Nieuw project</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Project naam *</label>
            <input
              type="text"
              required
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Bijv. Badkamer verbouwing"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              onFocus={(e) => (e.target.style.borderColor = '#288760')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            >
              {Object.entries(typeEmoji).map(([val, emoji]) => (
                <option key={val} value={val}>{emoji} {val.charAt(0).toUpperCase() + val.slice(1).replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>€</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="15.000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => (e.target.style.borderColor = '#288760')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Startdatum</label>
              <input
                type="date"
                value={startDatum}
                onChange={(e) => setStartDatum(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Einddatum</label>
              <input
                type="date"
                value={eindDatum}
                onChange={(e) => setEindDatum(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              />
            </div>
          </div>
          {error && (
            <div className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Annuleren
            </button>
            <button type="submit" disabled={loading || !naam} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Aanmaken...' : 'Project aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { total_expenses?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Kon projecten niet laden. Probeer het opnieuw.');
        return;
      }

      // Fetch expenses for each project
      if (data && data.length > 0) {
        const projectsWithExpenses = await Promise.all(
          data.map(async (project: Project) => {
            const { data: expenses } = await supabase
              .from('expenses')
              .select('amount')
              .eq('project_id', project.id);
            const total = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
            return { ...project, total_expenses: total };
          })
        );
        setProjects(projectsWithExpenses);
      } else {
        setProjects([]);
      }
    } catch {
      setError('Er is een onverwachte fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Mijn projecten</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projecten'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#288760' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuw project
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center justify-between" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
          <span>{error}</span>
          <button onClick={loadProjects} className="font-medium underline">Opnieuw proberen</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white border animate-pulse" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#F3F4F6' }} />
                <div className="flex-1">
                  <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: '#F3F4F6' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#F3F4F6' }} />
                </div>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F3F4F6' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Maak je eerste project aan</h3>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Begin met het beheren van je verbouwing door je eerste project aan te maken.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#288760' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Project aanmaken
          </button>
        </div>
      )}

      {/* Projects grid */}
      {!loading && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(project) => {
            setProjects((prev) => [{ ...project, total_expenses: 0 }, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
