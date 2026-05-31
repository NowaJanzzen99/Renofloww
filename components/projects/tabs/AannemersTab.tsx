'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Contractor } from '@/types';

interface Props {
  project: Project;
  initialContractors: Contractor[];
}

const specialties = ['Loodgieter', 'Timmerman', 'Elektricien', 'Tegelzetter', 'Schilder', 'Metselaar', 'Installateur', 'Stukadoor', 'Aannemer', 'Overig'];

function ContractorModal({ project, contractor, onClose, onSaved }: {
  project: Project;
  contractor?: Contractor;
  onClose: () => void;
  onSaved: (c: Contractor) => void;
}) {
  const [name, setName] = useState(contractor?.name || '');
  const [specialty, setSpecialty] = useState(contractor?.type || '');
  const [phone, setPhone] = useState(contractor?.phone || '');
  const [email, setEmail] = useState(contractor?.email || '');
  const [notes, setNotes] = useState(contractor?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const payload = { project_id: project.id, name, type: specialty || null, phone: phone || null, email: email || null, notes: notes || null };

    let data;
    if (contractor) {
      const res = await supabase.from('contractors').update(payload).eq('id', contractor.id).select().single();
      data = res.data;
    } else {
      const res = await supabase.from('contractors').insert(payload).select().single();
      data = res.data;
    }

    if (data) onSaved(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{contractor ? 'Aannemer bewerken' : 'Aannemer toevoegen'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Naam *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan de Vries" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Specialiteit</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
              <option value="">Kies specialiteit...</option>
              {specialties.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Telefoonnummer</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06-12345678" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Notities</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Aanvullende informatie..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading || !name} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AannemersTab({ project, initialContractors }: Props) {
  const [contractors, setContractors] = useState(initialContractors);
  const [showModal, setShowModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteContractor = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze aannemer wil verwijderen?')) return;
    const supabase = createClient();
    await supabase.from('contractors').delete().eq('id', id);
    setContractors((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Aannemers ({contractors.length})</h2>
        <button onClick={() => { setEditingContractor(undefined); setShowModal(true); }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Aannemer toevoegen
        </button>
      </div>

      {contractors.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">👷</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Nog geen aannemers</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Voeg aannemers toe om contacten bij te houden.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map((contractor) => (
            <div key={contractor.id} className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: '#288760' }}>
                    {contractor.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{contractor.name}</p>
                    {contractor.type && (
                      <p className="text-xs capitalize" style={{ color: '#6B7280' }}>{contractor.type}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingContractor(contractor); setShowModal(true); }} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => deleteContractor(contractor.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center" style={{ color: '#EF4444' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {contractor.phone && (
                  <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {contractor.phone}
                  </a>
                )}
                {contractor.email && (
                  <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {contractor.email}
                  </a>
                )}
                {contractor.notes && (
                  <p className="text-xs line-clamp-2 mt-1" style={{ color: '#9CA3AF' }}>{contractor.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ContractorModal
          project={project}
          contractor={editingContractor}
          onClose={() => setShowModal(false)}
          onSaved={(c) => {
            if (editingContractor) {
              setContractors((prev) => prev.map((x) => x.id === c.id ? c : x));
            } else {
              setContractors((prev) => [c, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
