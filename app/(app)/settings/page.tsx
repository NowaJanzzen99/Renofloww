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
  const [deleting, setDeleting] = useState(false);

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

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      setSaving(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
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
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage(data.error || 'Verwijderen van account is mislukt. Probeer het opnieuw.', true);
        setShowDeleteModal(false);
        setDeleteConfirm('');
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      showMessage('Er is een onverwachte fout opgetreden. Probeer het opnieuw.', true);
      setShowDeleteModal(false);
      setDeleteConfirm('');
    } finally {
      setDeleting(false);
    }
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
        <div className="space-y-5">
          <style>{`
            @keyframes rf-plan-shimmer {
              0% { transform: translateX(-100%) skewX(-20deg); }
              100% { transform: translateX(250%) skewX(-20deg); }
            }
            .rf-plan-btn { position: relative; overflow: hidden; transition: all 0.2s ease; }
            .rf-plan-btn::after {
              content: '';
              position: absolute; inset: 0;
              width: 33%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
              animation: rf-plan-shimmer 2.5s ease-in-out infinite;
              pointer-events: none;
            }
            .rf-plan-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(40,135,96,0.45) !important; }
            .rf-plan-btn:disabled::after { display: none; }
          `}</style>

          {/* Current status banner */}
          {profile?.is_pro ? (
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 100%)', boxShadow: '0 4px 20px rgba(13,31,26,0.25)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(40,135,96,0.3)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#6EE7B7' }}>
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black text-white">Renofloww Pro — Actief</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Je hebt volledige toegang tot alle functies.</p>
              </div>
            </div>
          ) : trialActive ? (
            <div className="rounded-2xl p-5 border" style={{ borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>Proefperiode actief</span>
                  <span className="text-sm font-semibold" style={{ color: trialDaysLeft <= 3 ? '#EF4444' : '#1A5140' }}>nog {trialDaysLeft} {trialDaysLeft === 1 ? 'dag' : 'dagen'}</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: '#D1FAE5' }}>
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.max(5, (trialDaysLeft / 14) * 100)}%`, backgroundColor: trialDaysLeft > 7 ? '#288760' : trialDaysLeft > 3 ? '#F59E0B' : '#EF4444' }} />
              </div>
              <p className="text-xs" style={{ color: '#1A5140' }}>
                Proefperiode eindigt op {trialEndsAt ? formatDate(trialEndsAt.toISOString()) : '—'} — upgrade nu om toegang te behouden.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-5 border" style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#EF4444' }}>Proefperiode verlopen</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Upgrade naar Pro om je verbouwing te blijven beheren.</p>
            </div>
          )}

          {/* Features overview */}
          {!profile?.is_pro && (
            <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Wat krijg je met Pro</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: '🏗️', title: 'Onbeperkt projecten', desc: 'Beheer meerdere verbouwingen tegelijk' },
                  { icon: '🤖', title: 'AI assistent',         desc: 'Plan taken, registreer kosten via chat' },
                  { icon: '📊', title: 'Volledige analytics',  desc: 'Inzicht in voortgang en kosten' },
                  { icon: '📅', title: 'Gantt planning',       desc: 'Visuele tijdlijn per ruimte' },
                  { icon: '💶', title: 'Offertevergelijker',   desc: 'Vergelijk aannemers side-by-side' },
                  { icon: '🔔', title: 'Slimme herinneringen', desc: 'Nooit meer een deadline vergeten' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{f.title}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing cards */}
          {!profile?.is_pro && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Yearly — featured */}
              <div
                className="rounded-2xl p-6 relative flex flex-col"
                style={{ background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 45%, #1e4d36 100%)', boxShadow: '0 8px 32px rgba(13,31,26,0.3)', order: 0 }}
              >
                {/* Glow */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(40,135,96,0.3) 0%, transparent 70%)' }} />
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-black whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: '#1A1A1A', boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}>
                    ⭐ Meest populair
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6EE7B7' }}>Jaarlijks</p>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-4xl font-black text-white">€79</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>/jaar</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#6EE7B7' }}>€6,58/maand · <strong>Bespaar €40</strong></p>
                  <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>= 2 maanden gratis</p>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    'Alles van Pro maandelijks',
                    'Prioriteit klantenservice',
                    'Vroege toegang tot nieuwe functies',
                    'Onbeperkte projectarchivering',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(110,231,183,0.2)' }}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#6EE7B7' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('yearly')}
                  disabled={saving}
                  className="rf-plan-btn w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
                  style={{ backgroundColor: '#288760', boxShadow: '0 4px 16px rgba(40,135,96,0.4)' }}
                >
                  {saving ? 'Laden...' : 'Start jaarlijks — Bespaar €40 →'}
                </button>
              </div>

              {/* Monthly */}
              <div
                className="rounded-2xl p-6 bg-white border flex flex-col"
                style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', order: 1 }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#9CA3AF' }}>Maandelijks</p>
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-4xl font-black" style={{ color: '#1A1A1A' }}>€9,99</span>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>/maand</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    'Onbeperkt projecten',
                    'AI assistent (ChatGPT-stijl)',
                    'Offertevergelijker',
                    'Gantt-planning per ruimte',
                    'Volledige analytics',
                    'Streaks & prestaties',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#1A1A1A' }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  disabled={saving}
                  className="rf-plan-btn w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ border: '2px solid #288760', color: '#288760', backgroundColor: 'transparent', boxShadow: '0 2px 8px rgba(40,135,96,0.15)' }}
                >
                  {saving ? 'Laden...' : 'Maandelijks starten →'}
                </button>
              </div>
            </div>
          )}

          {/* Trust line */}
          {!profile?.is_pro && (
            <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
              🔒 Veilig betalen via Stripe · Geen verborgen kosten · Direct opzegbaar
            </p>
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
              Je account en alle bijbehorende gegevens (projecten, taken, kosten, documenten, foto&apos;s)
              worden direct en permanent verwijderd — dit kan niet ongedaan worden gemaakt.
              {profile?.is_pro && ' Een actief abonnement wordt hierbij automatisch opgezegd.'}
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[88dvh] overflow-y-auto p-6">
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
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-40" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                Annuleren
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'VERWIJDER' || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: '#EF4444' }}
              >
                {deleting ? 'Bezig met verwijderen...' : 'Account verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
