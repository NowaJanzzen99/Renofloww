'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import type { Project, ProjectType } from '@/types';

interface Props {
  project: Project;
  onProjectUpdated: (p: Project) => void;
}

const projectTypes = PROJECT_TYPES;

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
  const [houseId, setHouseId] = useState(project.house_id ?? '');
  const [houses, setHouses] = useState<{ id: string; address: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Coverfoto state
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(project.cover_photo_url ?? '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadHouses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('houses').select('id, address').eq('user_id', user.id);
      setHouses(data || []);
    };
    loadHouses();
  }, []);

  const toggleType = (t: ProjectType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const primaryType: ProjectType =
    selectedTypes.length === 1 ? selectedTypes[0] : selectedTypes.length > 1 ? 'anders' : 'anders';

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/${project.id}/cover.${ext}`;

      // Eerst een eventueel bestaand bestand op dit pad verwijderen en dan
      // een schone insert doen — upsert vereist bredere storage-rechten
      // (select + insert + update) en gaf hier "upload mislukt". Delete +
      // insert gebruiken alleen rechten die elders in de app al bewezen werken.
      await supabase.storage.from('photos').remove([path]);
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file);
      if (uploadError) { setCoverError(`Upload mislukt: ${uploadError.message}`); return; }

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
      // Cache-busting: zonder dit blijft de browser de vorige foto tonen,
      // omdat de URL (bij hetzelfde bestandspad) exact hetzelfde blijft.
      const freshUrl = `${publicUrl}?v=${Date.now()}`;
      const { data, error } = await supabase
        .from('projects')
        .update({ cover_photo_url: freshUrl })
        .eq('id', project.id)
        .select()
        .single();

      if (error) { setCoverError(`Opslaan mislukt: ${error.message}`); return; }
      setCoverPhotoUrl(freshUrl);
      if (data) onProjectUpdated(data);
    } catch (err) {
      setCoverError('Er is een fout opgetreden: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const removeCoverPhoto = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Best-effort: ook het bestand zelf opruimen (alle bekende extensies).
      const paths = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].map((ext) => `${user.id}/${project.id}/cover.${ext}`);
      await supabase.storage.from('photos').remove(paths);
    }
    const { data, error } = await supabase
      .from('projects')
      .update({ cover_photo_url: null })
      .eq('id', project.id)
      .select()
      .single();
    if (!error) {
      setCoverPhotoUrl('');
      if (data) onProjectUpdated(data);
    }
  };

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
        house_id: houseId || null,
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

          {/* Woning koppelen */}
          {houses.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Woning</label>
              <select
                value={houseId}
                onChange={(e) => setHouseId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              >
                <option value="">Geen woning gekoppeld</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>{h.address || 'Woning zonder adres'}</option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>Bepaalt bij welke woning dit project meetelt op de Woningkosten-pagina.</p>
            </div>
          )}

          {/* Type — multi-select */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
              Type verbouwing
              <span className="ml-1 text-xs font-normal" style={{ color: '#9CA3AF' }}>(meerdere mogelijk)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Coverfoto — apart, want wordt direct opgeslagen bij uploaden */}
      <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>Coverfoto</h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Toon een eigen foto in plaats van de emoji op de projectkaart en bovenaan dit project. Wordt direct opgeslagen.
        </p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#E5E7EB' }}>
            {coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPhotoUrl} alt="Coverfoto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{projectTypes.find((t) => t.type === primaryType)?.emoji ?? '🏠'}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer inline-block w-fit"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            >
              {uploadingCover ? 'Bezig met uploaden...' : coverPhotoUrl ? 'Foto vervangen' : 'Foto uploaden'}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
            </label>
            {coverPhotoUrl && (
              <button onClick={removeCoverPhoto} className="text-xs font-medium text-left" style={{ color: '#EF4444' }}>
                Verwijder foto (gebruik weer emoji)
              </button>
            )}
          </div>
        </div>
        {coverError && (
          <div className="mt-3 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
            {coverError}
          </div>
        )}
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[88dvh] overflow-y-auto p-6">
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
