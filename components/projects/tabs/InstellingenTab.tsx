'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectType } from '@/types';

interface Props {
  project: Project;
  onProjectUpdated: (p: Project) => void;
}

const projectTypes: { type: ProjectType; label: string; emoji: string }[] = [
  { type: 'badkamer', label: 'Badkamer', emoji: '🚿' },
  { type: 'keuken', label: 'Keuken', emoji: '🍳' },
  { type: 'woonkamer', label: 'Woonkamer', emoji: '🛋️' },
  { type: 'slaapkamer', label: 'Slaapkamer', emoji: '🛏️' },
  { type: 'gehele_woning', label: 'Gehele woning', emoji: '🏠' },
  { type: 'anders', label: 'Anders', emoji: '✏️' },
];

function parseAmount(v: string) {
  return v ? parseFloat(v.replace(/\./g, '').replace(',', '.')) : null;
}

export default function InstellingenTab({ project, onProjectUpdated }: Props) {
  const router = useRouter();

  // Edit state — pre-filled from project
  const [naam, setNaam] = useState(project.name);
  const [selectedTypes, setSelectedTypes] = useState<ProjectType[]>(
    project.type ? [project.type] : []
  );
  const [budget, setBudget] = useState(
    project.budget ? String(project.budget) : ''
  );
  const [startDatum, setStartDatum] = useState(project.start_date ?? '');
  const [eindDatum, setEindDatum] = useState(project.end_date ?? '');
  const [beschrijving, setBeschrijving] = useState(project.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const toggleType = (t: ProjectType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const primaryType: ProjectType =
    selectedTypes.length === 1 ? selectedTypes[0] : selectedTypes.length > 1 ? 'anders' : 'anders';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: naam.trim(),
        type: primaryType,
        budget: parseAmount(budget),
        start_date: startDatum || null,
        end_date: eindDatum || null,
        description: beschrijving || null,
      })
      .eq('id', project.id)
      .select()
      .single();

    if (error) {
      setSaveError('Opslaan mislukt. Probeer opnieuw.');
    } else if (data) {
      onProjectUpdated(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteInput !== project.name) return;
    setDeleting(true);

    const supabase = createClient();

    // Delete all related data first (in dependency order)
    await Promise.all([
      supabase.from('tasks').delete().eq('project_id', project.id),
      supabase.from('expenses').delete().eq('project_id', project.id),
      supabase.from('quotes').delete().eq('project_id', project.id),
      supabase.from('extra_work').delete().eq('project_id', project.id),
      supabase.from('documents').delete().eq('project_id', project.id),
      supabase.from('photos').delete().eq('project_id', project.id),
      supabase.from('reminders').delete().eq('project_id', project.id),
      supabase.from('notifications').delete().eq('project_id', project.id),
      supabase.from('ai_messages').delete().eq('project_id', project.id),
    ]);

    // Delete contractors (after quotes that reference them)
    await supabase.from('contractors').delete().eq('project_id', project.id);

    // Delete rooms (after tasks that reference them)
    await supabase.from('rooms').delete().eq('project_id', project.id);

    // Finally delete the project itself
    await supabase.from('projects').delete().eq('id', project.id);

    router.push('/projects');
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Edit project details */}
      <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 className="text-base font-semibold mb-5" style={{ color: '#1A1A1A' }}>Projectgegevens bewerken</h2>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Projectnaam *</label>
            <input
              required
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              onFocus={(e) => (e.target.style.borderColor = '#288760')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Type — multi-select */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
              Type verbouwing
              <span className="ml-1 text-xs font-normal" style={{ color: '#9CA3AF' }}>(meerdere mogelijk)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {projectTypes.map(({ type, label, emoji }) => {
                const selected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center text-sm transition-all"
                    style={{
                      borderColor: selected ? '#288760' : '#E5E7EB',
                      backgroundColor: selected ? '#F0FAF5' : 'white',
                      color: selected ? '#288760' : '#6B7280',
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs leading-tight">{label}</span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#288760' }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedTypes.length > 1 && (
              <p className="mt-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                Geselecteerd: {selectedTypes.map(t => projectTypes.find(p => p.type === t)?.label).join(', ')}
              </p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Budget (€)</label>
            <input
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="bijv. 15000"
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              onFocus={(e) => (e.target.style.borderColor = '#288760')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
            <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>Typ een getal, bijv. 50000 of 50.000</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Startdatum</label>
              <input
                type="date"
                value={startDatum}
                onChange={(e) => setStartDatum(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Einddatum</label>
              <input
                type="date"
                value={eindDatum}
                onChange={(e) => setEindDatum(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Omschrijving</label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
              placeholder="Optionele omschrijving van het project..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            />
          </div>

          {saveError && (
            <div className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
              {saveError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !naam.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#288760' }}
          >
            {saving ? 'Opslaan...' : saveSuccess ? '✓ Opgeslagen!' : 'Wijzigingen opslaan'}
          </button>
        </form>
      </div>

      {/* Danger zone — delete project */}
      <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#FECACA', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: '#EF4444' }}>Danger zone</h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Het verwijderen van dit project is permanent. Alle taken, kosten, aannemers, offertes, foto's en documenten worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-red-50"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}
        >
          Project verwijderen
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#EF4444' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Project definitief verwijderen?</h3>
            </div>

            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Typ de naam van het project om te bevestigen:
            </p>
            <p className="text-sm font-semibold mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#1A1A1A' }}>
              {project.name}
            </p>
            <input
              autoFocus
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Typ de projectnaam..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none mb-4"
              style={{ borderColor: deleteInput === project.name ? '#EF4444' : '#E5E7EB', color: '#1A1A1A' }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== project.name || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: '#EF4444' }}
              >
                {deleting ? 'Verwijderen...' : 'Ja, verwijder project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
