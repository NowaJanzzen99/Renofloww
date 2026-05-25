'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Document } from '@/types';

interface Props {
  project: Project;
}

const categories = ['alle', 'offertes', 'vergunningen', 'tekeningen', 'overig'] as const;

const fileIcon = (type: string | null) => {
  if (!type) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return '🖼️';
  if (type.includes('word') || type.includes('doc')) return '📝';
  return '📄';
};

export default function DocumentenTab({ project }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>('alle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocs = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('documents').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (data) setDocuments(data);
      setLoading(false);
    };
    loadDocs();
  }, [project.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${project.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);

      if (uploadError) {
        setError('Upload mislukt. Controleer of je de juiste rechten hebt.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

      const { data: doc } = await supabase.from('documents').insert({
        project_id: project.id,
        name: file.name,
        url: publicUrl,
        type: file.type,
        category: activeCategory === 'alle' ? 'overig' : activeCategory,
        size: file.size,
        uploaded_by: user.id,
      }).select().single();

      if (doc) setDocuments((prev) => [doc, ...prev]);
    } catch {
      setError('Er is een fout opgetreden bij het uploaden.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Weet je zeker dat je "${doc.name}" wil verwijderen?`)) return;
    const supabase = createClient();
    await supabase.from('documents').delete().eq('id', doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const filtered = activeCategory === 'alle'
    ? documents
    : documents.filter((d) => d.category === activeCategory);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Documenten ({documents.length})</h2>
        <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white cursor-pointer ${uploading ? 'opacity-60' : ''}`} style={{ backgroundColor: '#288760' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {uploading ? 'Uploaden...' : 'Document uploaden'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>{error}</div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors"
            style={{ backgroundColor: activeCategory === cat ? '#288760' : '#F3F4F6', color: activeCategory === cat ? '#FFFFFF' : '#6B7280' }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">📁</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Geen documenten</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Upload documenten zoals offertes, tekeningen of vergunningen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
              <span className="text-xl">{fileIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{doc.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{doc.category} · {formatSize(doc.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>
                  Downloaden
                </a>
                <button onClick={() => deleteDocument(doc)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center" style={{ color: '#EF4444' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
