'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Room, Photo, PhotoPhase } from '@/types';

interface Props {
  project: Project;
  initialRooms: Room[];
}

const phases: { value: PhotoPhase; label: string; emoji: string }[] = [
  { value: 'voor', label: 'Voor', emoji: '📦' },
  { value: 'tijdens', label: 'Tijdens', emoji: '🔨' },
  { value: 'na', label: 'Na', emoji: '✨' },
];

export default function FotosTab({ project, initialRooms }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activePhase, setActivePhase] = useState<PhotoPhase>('voor');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [note, setNote] = useState('');
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (data) setPhotos(data);
      setLoading(false);
    };
    load();
  }, [project.id]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Alleen afbeeldingen zijn toegestaan (jpg, png, webp, heic).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Afbeelding mag maximaal 20 MB zijn.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Niet ingelogd.'); return; }

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${project.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(`Upload mislukt: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);

      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          project_id: project.id,
          room_id: selectedRoom || null,
          url: publicUrl,
          phase: activePhase,
          note: note || null,
          taken_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) { setError('Opslaan in database mislukt.'); return; }
      if (photo) setPhotos((prev) => [photo, ...prev]);
      setNote('');
    } catch (err) {
      setError('Onverwachte fout bij uploaden. Probeer opnieuw.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deletePhoto = async (photo: Photo) => {
    setDeleting(photo.id);
    try {
      const supabase = createClient();
      // Extract path from URL
      const url = new URL(photo.url);
      const pathParts = url.pathname.split('/object/public/photos/');
      const storagePath = pathParts[1];

      if (storagePath) {
        await supabase.storage.from('photos').remove([storagePath]);
      }
      await supabase.from('photos').delete().eq('id', photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (lightbox?.id === photo.id) setLightbox(null);
    } finally {
      setDeleting(null);
    }
  };

  const phasePhotos = photos.filter((p) => p.phase === activePhase);
  const getRoomName = (roomId: string | null) =>
    initialRooms.find((r) => r.id === roomId)?.name ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>
          Foto's ({photos.length})
        </h2>
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
              {phase.emoji} {phase.label}
              {count > 0 && <span className="ml-1 text-xs" style={{ color: '#9CA3AF' }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Upload section */}
      <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#E5E7EB' }}>
        <p className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>
          Foto toevoegen — {phases.find((p) => p.value === activePhase)?.label} fase
        </p>

        {/* Room + note row */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
          >
            <option value="">Geen ruimte</option>
            {initialRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notitie (optioneel)"
            className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="rounded-xl border-2 border-dashed transition-all"
          style={{
            borderColor: dragOver ? '#288760' : '#D1D5DB',
            backgroundColor: dragOver ? '#F0FAF5' : '#FAFAFA',
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#288760', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#6B7280' }}>Uploaden...</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-8 gap-2 cursor-pointer">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: dragOver ? '#288760' : '#9CA3AF' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: dragOver ? '#288760' : '#6B7280' }}>
                Sleep een foto hierheen of <span style={{ color: '#288760', textDecoration: 'underline' }}>klik om te kiezen</span>
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>JPG, PNG, WEBP, HEIC — max 20 MB</p>
              {/* capture="environment" lets mobile users use their camera directly */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {error && (
          <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
            {error}
          </div>
        )}
      </div>

      {/* Photos grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
          ))}
        </div>
      ) : phasePhotos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>
            Nog geen foto's voor de {phases.find((p) => p.value === activePhase)?.label.toLowerCase()} fase
          </p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Upload foto's om de voortgang van je verbouwing te documenteren.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {phasePhotos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <button
                className="w-full h-full"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.note || 'Foto'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </button>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {photo.note && <p className="text-white text-xs font-medium truncate">{photo.note}</p>}
                {getRoomName(photo.room_id) && <p className="text-white/70 text-xs">{getRoomName(photo.room_id)}</p>}
              </div>

              {/* Delete button */}
              <button
                onClick={() => deletePhoto(photo)}
                disabled={deleting === photo.id}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                {deleting === photo.id ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.note || 'Foto'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto block"
            />
            {(lightbox.note || lightbox.room_id) && (
              <div className="mt-3 text-center">
                {lightbox.note && <p className="text-white text-sm">{lightbox.note}</p>}
                {lightbox.room_id && <p className="text-white/60 text-xs mt-1">{getRoomName(lightbox.room_id)}</p>}
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Delete from lightbox */}
            <button
              onClick={() => deletePhoto(lightbox)}
              disabled={deleting === lightbox.id}
              className="absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#EF4444' }}
            >
              {deleting === lightbox.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
