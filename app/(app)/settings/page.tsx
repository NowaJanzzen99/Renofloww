'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { formatDate } from '@/lib/utils';

const tabs = ['Profiel', 'Meldingen', 'Abonnement', 'Account verwijderen'] as const;
type Tab = typeof tabs[number];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Profiel');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile state
  const [name, setName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState({
    budget_warning: true,
    task_reminders: true,
    quote_updates: true,
    extra_work_requests: true,
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setName(data.name || '');
        if (data.notification_preferences) {
          setNotifPrefs(data.notification_preferences);
        }
      }
      setLoading(false);
    };
    load();

    // Check URL hash for tab
    const hash = window.location.hash.replace('#', '');
    if (hash === 'abonnement') setActiveTab('Abonnement');
  }, []);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 3000);
  };

  const saveName = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles').update({ name }).eq('id', profile!.id);
    if (err) showMessage('Kon naam niet opslaan.', true);
    else { setProfile((prev) => prev ? { ...prev, name } : prev); showMessage('Naam opgeslagen.'); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) { showMessage('Upload mislukt.', true); return; }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
      showMessage('Profielfoto bijgewerkt.');
    } catch { showMessage('Er is een fout opgetreden.', true); }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  const saveNotifPrefs = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles').update({ notification_preferences: notifPrefs }).eq('id', profile!.id);
    if (err) showMessage('Kon meldingsinstellingen niet opslaan.', true);
    else showMessage('Meldingsinstellingen opgeslagen.');
    setSaving(false);
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showMessage(data.error || 'Kon betalingspagina niet openen.', true);
      }
    } catch {
      showMessage('Kon betalingspagina niet openen. Probeer het opnieuw.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'VERWIJDER') return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const trialActive = trialEndsAt && trialEndsAt > new Date();

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
      <span className="text-sm" style={{ color: '#1A1A1A' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#288760' : '#E5E7EB' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-48" style={{ backgroundColor: '#F3F4F6' }} />
          <div className="h-48 rounded-2xl" style={{ backgroundColor: '#F3F4F6' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Instellingen</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{ backgroundColor: '#F3F4F6' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
              color: activeTab === tab ? '#1A1A1A' : '#6B7280',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feedback messages */}
      {success && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}>{success}</div>}
      {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>{error}</div>}

      {/* Profile tab */}
      {activeTab === 'Profiel' && (
        <div className="rounded-2xl bg-white border p-6 space-y-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold" style={{ backgroundColor: '#288760' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  : (profile?.name?.[0] || profile?.email?.[0] || 'U').toUpperCase()
                }
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center cursor-pointer" style={{ borderColor: '#288760' }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{profile?.name || 'Geen naam'}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{avatarUploading ? 'Uploaden...' : 'Klik op het camera icoon om te wijzigen'}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              onFocus={(e) => (e.target.style.borderColor = '#288760')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>E-mailadres</label>
            <div className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF', backgroundColor: '#F9FAFB' }}>
              {profile?.email}
            </div>
            <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>E-mailadres kan niet worden gewijzigd</p>
          </div>

          <button onClick={saveName} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#288760' }}>
            {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </button>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'Meldingen' && (
        <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Meldingsinstellingen</h2>
          <Toggle checked={notifPrefs.budget_warning} onChange={(v) => setNotifPrefs((p) => ({ ...p, budget_warning: v }))} label="Budget waarschuwing (bij 80%)" />
          <Toggle checked={notifPrefs.task_reminders} onChange={(v) => setNotifPrefs((p) => ({ ...p, task_reminders: v }))} label="Taak herinneringen" />
          <Toggle checked={notifPrefs.quote_updates} onChange={(v) => setNotifPrefs((p) => ({ ...p, quote_updates: v }))} label="Offerte updates" />
          <Toggle checked={notifPrefs.extra_work_requests} onChange={(v) => setNotifPrefs((p) => ({ ...p, extra_work_requests: v }))} label="Meerwerk verzoeken" />

          <button onClick={saveNotifPrefs} disabled={saving} className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#288760' }}>
            {saving ? 'Opslaan...' : 'Instellingen opslaan'}
          </button>
        </div>
      )}

      {/* Subscription tab */}
      {activeTab === 'Abonnement' && (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Huidig abonnement</h2>
            {profile?.is_pro ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#288760' }}>Pro</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>Actief</span>
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Je hebt toegang tot alle Pro functies.</p>
                <button className="text-sm font-medium" style={{ color: '#EF4444' }}>Abonnement opzeggen</button>
              </div>
            ) : trialActive ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>Proefperiode</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>{trialDaysLeft} dagen resterend</span>
                </div>
                <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: '#E5E7EB' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(0, (trialDaysLeft / 14) * 100)}%`,
                      backgroundColor: trialDaysLeft > 7 ? '#288760' : trialDaysLeft > 3 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Je proefperiode loopt af op {trialEndsAt ? formatDate(trialEndsAt.toISOString()) : '—'}.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>Gratis</span>
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Alleen-lezen toegang. Upgrade om te blijven verbouwen.</p>
              </div>
            )}
          </div>

          {/* Pricing cards */}
          {!profile?.is_pro && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 p-5" style={{ borderColor: '#288760', backgroundColor: '#F8FAF9' }}>
                <h3 className="text-base font-bold mb-1" style={{ color: '#1A1A1A' }}>Pro maandelijks</h3>
                <p className="text-3xl font-bold mb-4" style={{ color: '#288760' }}>€9,99<span className="text-base font-normal" style={{ color: '#6B7280' }}>/maand</span></p>
                <ul className="space-y-2 mb-5">
                  {['Onbeperkt projecten', 'AI assistent', 'Alle functies'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_1Tb6pAHnmzUK6aJZDQPKmBRg')} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity" style={{ backgroundColor: '#288760' }}>
                  {saving ? 'Laden...' : 'Upgrade naar Pro'}
                </button>
              </div>
              <div className="rounded-2xl border p-5 relative" style={{ borderColor: '#E5E7EB', backgroundColor: 'white' }}>
                <div className="absolute -top-3 left-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>2 maanden gratis</span>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: '#1A1A1A' }}>Jaarlijks</h3>
                <p className="text-3xl font-bold mb-1" style={{ color: '#1A1A1A' }}>€79<span className="text-base font-normal" style={{ color: '#6B7280' }}>/jaar</span></p>
                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>€6,58/maand · Bespaar €40</p>
                <ul className="space-y-2 mb-5">
                  {['Alles van Pro', 'Prioriteit support', 'Vroege toegang'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || 'price_1Tb6pDHnmzUK6aJZYadqyaq9')} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-60" style={{ borderColor: '#288760', color: '#288760' }}>
                  {saving ? 'Laden...' : 'Jaarlijks starten'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger tab */}
      {activeTab === 'Account verwijderen' && (
        <div className="rounded-2xl bg-white border p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: '#EF4444' }}>Gevaarlijke zone</h2>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Acties hier kunnen niet ongedaan worden gemaakt.
          </p>
          <div className="rounded-xl border p-4" style={{ borderColor: '#FECACA' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#EF4444' }}>Account verwijderen</h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Je gegevens worden 30 dagen bewaard na verwijdering, daarna worden ze permanent verwijderd.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#EF4444' }}
            >
              Account verwijderen
            </button>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: '#EF4444' }}>Account verwijderen</h2>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Typ <strong>VERWIJDER</strong> om te bevestigen dat je je account wil verwijderen.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="VERWIJDER"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4"
              style={{ borderColor: '#FECACA', color: '#1A1A1A' }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                Annuleren
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'VERWIJDER'}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: '#EF4444' }}
              >
                Account verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
