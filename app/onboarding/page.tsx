'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ProjectType } from '@/types';

const projectTypes: { type: ProjectType; label: string; emoji: string }[] = [
  { type: 'badkamer', label: 'Badkamer', emoji: '🚿' },
  { type: 'keuken', label: 'Keuken', emoji: '🍳' },
  { type: 'woonkamer', label: 'Woonkamer', emoji: '🛋️' },
  { type: 'slaapkamer', label: 'Slaapkamer', emoji: '🛏️' },
  { type: 'gehele_woning', label: 'Gehele woning', emoji: '🏠' },
  { type: 'anders', label: 'Anders', emoji: '✏️' },
];

const tourSlides = [
  {
    icon: '💰',
    title: 'Budget bijhouden',
    description: 'Voeg kosten toe per categorie (materiaal, arbeid, vergunning) en zie altijd hoeveel budget je nog over hebt.',
  },
  {
    icon: '👷',
    title: 'Aannemers & offertes',
    description: 'Sla al je aannemercontacten op, voeg offertes toe en vergelijk ze naast elkaar om de beste keus te maken.',
  },
  {
    icon: '🤖',
    title: 'AI assistent',
    description: 'Stel vragen over je verbouwing aan onze AI. Van vergunningen tot kostenramingen — altijd klaar om te helpen.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tourSlide, setTourSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);

  // Step 2
  const [projectNaam, setProjectNaam] = useState('');
  const [budget, setBudget] = useState('');
  const [startDatum, setStartDatum] = useState('');
  const [eindDatum, setEindDatum] = useState('');

  // Step 3
  const [ruimteNaam, setRuimteNaam] = useState('');

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleSkip = () => {
    if (step === 3) {
      setStep(4);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update profile with trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          trial_ends_at: trialEndsAt.toISOString(),
          is_pro: false,
        });

      // Create project if name provided
      if (projectNaam) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectNaam,
            type: selectedType || 'anders',
            budget: budget ? parseFloat(budget.replace(/\./g, '').replace(',', '.')) : null,
            start_date: startDatum || null,
            end_date: eindDatum || null,
            status: 'lopend',
          })
          .select()
          .single();

        if (projectError) {
          console.error('Project error:', projectError);
        }

        // Create room if provided
        if (project && ruimteNaam) {
          await supabase.from('rooms').insert({
            project_id: project.id,
            name: ruimteNaam,
          });
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAF9' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#288760' }}>
            R
          </div>
          <span className="font-bold text-base" style={{ color: '#1A1A1A' }}>Renofloww</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#6B7280' }}>Stap {step} van {totalSteps}</span>
          <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%`, backgroundColor: '#288760' }}
            />
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="text-sm font-medium"
          style={{ color: '#6B7280' }}
        >
          Overslaan
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* Step 1: Project type */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Welkom bij Renofloww 👋
                </h1>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Wat ga je verbouwen?
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {projectTypes.map(({ type, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="rounded-2xl p-5 border-2 text-center transition-all"
                    style={{
                      borderColor: selectedType === type ? '#288760' : '#E5E7EB',
                      backgroundColor: selectedType === type ? '#F8FAF9' : '#FFFFFF',
                      boxShadow: selectedType === type ? '0 0 0 3px rgba(40,135,96,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{label}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!selectedType}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#288760' }}
                >
                  Volgende
                  <svg className="ml-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Project details */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Project details
                </h1>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Vertel ons meer over je {projectTypes.find(t => t.type === selectedType)?.label.toLowerCase()} verbouwing.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-white border space-y-5" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                    Project naam <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bijv. Badkamer renovatie begane grond"
                    value={projectNaam}
                    onChange={(e) => setProjectNaam(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                    onFocus={(e) => (e.target.style.borderColor = '#288760')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                    Totaal budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#6B7280' }}>€</span>
                    <input
                      type="number"
                      placeholder="15.000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                      onFocus={(e) => (e.target.style.borderColor = '#288760')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={startDatum}
                      onChange={(e) => setStartDatum(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                      onFocus={(e) => (e.target.style.borderColor = '#288760')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                      Verwachte einddatum
                    </label>
                    <input
                      type="date"
                      value={eindDatum}
                      onChange={(e) => setEindDatum(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                      onFocus={(e) => (e.target.style.borderColor = '#288760')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                >
                  Terug
                </button>
                <button
                  onClick={handleNext}
                  disabled={!projectNaam}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#288760' }}
                >
                  Volgende
                  <svg className="ml-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First room */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Eerste ruimte (optioneel)
                </h1>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Voeg je eerste ruimte toe om taken en foto's per ruimte bij te houden.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-white border mb-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                  Ruimte naam
                </label>
                <input
                  type="text"
                  placeholder="Bijv. Badkamer begane grond"
                  value={ruimteNaam}
                  onChange={(e) => setRuimteNaam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#288760')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
                <p className="mt-2 text-xs" style={{ color: '#6B7280' }}>
                  Je kunt altijd meer ruimtes toevoegen vanuit je project.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                >
                  Terug
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    Overslaan
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#288760' }}
                  >
                    Volgende
                    <svg className="ml-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: App tour */}
          {step === 4 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Klaar om te beginnen!
                </h1>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Een korte rondleiding door de app.
                </p>
              </div>

              {/* Tour slide */}
              <div className="rounded-2xl p-8 bg-white border text-center mb-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: '240px' }}>
                <div className="text-5xl mb-4">{tourSlides[tourSlide].icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1A1A1A' }}>
                  {tourSlides[tourSlide].title}
                </h3>
                <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: '#6B7280' }}>
                  {tourSlides[tourSlide].description}
                </p>
              </div>

              {/* Slide dots */}
              <div className="flex justify-center gap-2 mb-6">
                {tourSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourSlide(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: tourSlide === i ? '#288760' : '#E5E7EB',
                      transform: tourSlide === i ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    if (tourSlide > 0) {
                      setTourSlide(tourSlide - 1);
                    } else {
                      setStep(3);
                    }
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                >
                  Terug
                </button>

                {tourSlide < tourSlides.length - 1 ? (
                  <button
                    onClick={() => setTourSlide(tourSlide + 1)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#288760' }}
                  >
                    Volgende
                    <svg className="ml-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#288760' }}
                  >
                    {loading ? 'Bezig...' : 'Naar mijn dashboard 🎉'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
