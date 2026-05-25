'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Room, Photo, PhotoPhase } from '@/types';

interface Props {
  project: Project;
  initialRooms: Room[];
}

const phases: { value: PhotoPhase; label: string }[] = [
  { value: 'voor', label: 'Voor' },
  { value: 'tijdens', label: 'Tijdens' },
  { value: 'na', label: 'Na' },
];

export default function FotosTab({ project, initialRooms }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activePhase, setActivePhase] = useState<PhotoPhase>('voor');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [note, setNote] = useState('');
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('photos').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (data) setPhotos(data);
      setLoading(false);
    };
    loadPhotos();
  }, [project.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Alleen afbeeldingen zijn toegestaan.');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${project.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file);

      if (uploadError) {
        setError('Upload mislukt. Controleer of de opslag bucket bestaat.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);

      const { data: photo } = await supabase.from('photos').insert({
        project_id: project.id,
        room_id: selectedRoom || null,
        url: publicUrl,
        phase: activePhase,
        note: note || null,
      }).select().single();

      if (photo) setPhotos((prev) => [photo, ...prev]);
      setNote('');
    } catch {
      setError('Er is een fout opgetreden bij het uploaden.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const phasePhotos = photos.filter((p) => p.phase === activePhase);

  const getRoomName = (roomId: string | null) =>
    initialRooms.find((r) => r.id === roomId)?.name || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Foto's ({photos.length})</h2>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F3F4F6' }}>
        {phases.map((phase) => {
          const count = photos.filter((p) => p.phase === phase.value).length;
          return (
            <button
              key={phase.value}
              onClick={() => setActivePhase(phase.value)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activePhase === phase.value ? '#FFFFFF' : 'transparent',
                color: activePhase === phase.value ? '#1A1A1A' : '#6B7280',
                boxShadow: activePhase === phase.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {phase.label} {count > 0 && <span className="ml-1 text-xs" style={{ color: '#9CA3AF' }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Upload section */}
      <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB' }}>
        <p className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>Foto toevoegen — {phases.find((p) => p.value === activePhase)?.label} fase</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
            <option value="">Geen ruimte</option>
            {initialRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notitie (optioneel)" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer ${uploading ? 'opacity-60' : ''}`} style={{ backgroundColor: '#288760' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {uploading ? 'Uploaden...' : "Foto uploaden"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        {error && <p className="mt-2 text-xs" style={{ color: '#EF4444' }}>{error}</p>}
      </div>

      {/* Photos grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
          ))}
        </div>
      ) : phasePhotos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">📸</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Geen foto's voor {phases.find((p) => p.value === activePhase)?.label.toLowerCase()} fase</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Upload foto's om de voortgang te documenteren.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {phasePhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="group relative aspect-square rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <img src={photo.url} alt={photo.note || 'Foto'} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.note && <p className="text-white text-xs font-medium">{photo.note}</p>}
                  {getRoomName(photo.room_id) && <p className="text-white/80 text-xs">{getRoomName(photo.room_id)}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.note || 'Foto'} className="max-w-full max-h-screen object-contain rounded-xl" />
            {(lightbox.note || lightbox.room_id) && (
              <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-xl" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                {lightbox.note && <p className="text-white text-sm">{lightbox.note}</p>}
                {lightbox.room_id && <p className="text-white/70 text-xs">{getRoomName(lightbox.room_id)}</p>}
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
