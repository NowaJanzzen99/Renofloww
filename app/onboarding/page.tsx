'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RenoflowwLogo from '@/components/RenoflowwLogo';
import type { ProjectType, WoningType } from '@/types';

const projectTypes: { type: ProjectType; label: string; emoji: string }[] = [
  { type: 'badkamer',     label: 'Badkamer',      emoji: '🚿' },
  { type: 'keuken',       label: 'Keuken',         emoji: '🍳' },
  { type: 'woonkamer',    label: 'Woonkamer',      emoji: '🛋️' },
  { type: 'slaapkamer',   label: 'Slaapkamer',     emoji: '🛏️' },
  { type: 'gehele_woning',label: 'Gehele woning',  emoji: '🏠' },
  { type: 'anders',       label: 'Anders',          emoji: '✏️' },
];

const woningTypes: { type: WoningType; label: string; emoji: string }[] = [
  { type: 'appartement',        label: 'Appartement',     emoji: '🏢' },
  { type: 'tussenwoning',       label: 'Tussenwoning',    emoji: '🏘️' },
  { type: 'hoekwoning',         label: 'Hoekwoning',      emoji: '🏠' },
  { type: 'twee_onder_een_kap', label: '2-onder-1-kap',   emoji: '🏡' },
  { type: 'vrijstaand',         label: 'Vrijstaand',      emoji: '🏰' },
];

const tourSlides = [
  {
    icon: '📊',
    title: 'Dashboard overzicht',
    description: 'Jouw persoonlijk dashboard toont budget, taken voor vandaag, aankomende deadlines en een AI-tip. Heb je meerdere projecten? Wissel eenvoudig via de project-knoppen bovenaan.',
  },
  {
    icon: '🏠',
    title: 'Woningkosten bijhouden',
    description: 'Houd al je kosten bij: verbouwingen, onderhoud, verzekeringen en belastingen. Zie je totale investering per categorie in één helder overzicht.',
  },
  {
    icon: '📈',
    title: 'Woningwaarde berekenen',
    description: 'Bereken je geschatte marktwaarde via Eurostat-data en zie je werkelijke overwaarde. Heb je meerdere woningen? Voeg ze toe en bekijk alle waarden.',
  },
  {
    icon: '💰',
    title: 'Budget & kosten beheren',
    description: 'Voeg kosten, offertes en aannemers toe per verbouwingsproject. Zie realtime hoeveel budget je nog over hebt en ontvang waarschuwingen op tijd.',
  },
  {
    icon: '🤖',
    title: 'AI assistent',
    description: 'Stel vragen, maak taken aan en registreer kosten via de AI-chat. Van vergunningsvragen tot kostenramingen — altijd direct beschikbaar.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tourSlide, setTourSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — woning profiel
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedWoningType, setSelectedWoningType] = useState<WoningType | ''>('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  // Step 2 — project type
  const [selectedTypes, setSelectedTypes] = useState<ProjectType[]>([]);
  const toggleType = (t: ProjectType) =>
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const primaryType: ProjectType = selectedTypes.length === 1 ? selectedTypes[0] : 'anders';

  // Step 3 — project details
  const [projectNaam, setProjectNaam] = useState('');
  const [budget, setBudget] = useState('');
  const [startDatum, setStartDatum] = useState('');
  const [eindDatum, setEindDatum] = useState('');

  const totalSteps = 4;

  const inp = 'w-full px-4 py-3 rounded-xl border text-sm outline-none';
  const inpStyle = { borderColor: '#E5E7EB', color: '#1A1A1A', fontSize: '16px' };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#288760');
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#E5E7EB');

  const handleSkip = () => {
    if (step < totalSteps) {
      setStep(step + 1);
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
      if (!user) { router.push('/login'); return; }

      // Update profile with trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        trial_ends_at: trialEndsAt.toISOString(),
        is_pro: false,
      });

      // Create house if any house info was provided
      let houseId: string | null = null;
      const hasHouseInfo = address || postcode || selectedWoningType || purchasePrice || purchaseDate;
      if (hasHouseInfo) {
        const { data: house } = await supabase
          .from('houses')
          .insert({
            user_id: user.id,
            address: address || null,
            postcode: postcode || null,
            woningtype: selectedWoningType || null,
            purchase_price: purchasePrice ? parseFloat(purchasePrice.replace(/\./g, '').replace(',', '.')) : null,
            purchase_date: purchaseDate || null,
          })
          .select()
          .single();
        houseId = house?.id || null;
      }

      // Create project if name provided
      if (projectNaam) {
        await supabase.from('projects').insert({
          user_id: user.id,
          name: projectNaam,
          type: primaryType,
          budget: budget ? parseFloat(budget.replace(/\./g, '').replace(',', '.')) : null,
          start_date: startDatum || null,
          end_date: eindDatum || null,
          status: 'lopend',
          ...(houseId ? { house_id: houseId } : {}),
        });
      }

      router.push('/dashboard');
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAF9' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RenoflowwLogo variant="icon" size="sm" />
            <span className="font-bold text-base" style={{ color: '#1A1A1A' }}>Renofloww</span>
          </div>
          <button onClick={handleSkip} className="text-sm font-medium" style={{ color: '#6B7280' }}>
            Overslaan
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>Stap {step} van {totalSteps}</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%`, backgroundColor: '#288760' }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 pt-6">
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Woning profiel ──────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🏠</div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Je woning instellen</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Dit gebruiken we voor je woningkosten en waarde-overzicht. Alles is optioneel.
                </p>
              </div>

              <div className="rounded-2xl p-4 sm:p-6 bg-white border space-y-4" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Adres</label>
                  <input type="text" className={inp} style={inpStyle} placeholder="Hoofdstraat 1" value={address} onChange={(e) => setAddress(e.target.value)} onFocus={focus} onBlur={blur} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Postcode</label>
                    <input type="text" className={inp} style={inpStyle} placeholder="1234 AB" value={postcode} onChange={(e) => setPostcode(e.target.value)} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Woningtype</label>
                    <select className={inp} style={inpStyle} value={selectedWoningType} onChange={(e) => setSelectedWoningType(e.target.value as WoningType | '')} onFocus={focus} onBlur={blur}>
                      <option value="">Selecteer type</option>
                      {woningTypes.map(({ type, label, emoji }) => (
                        <option key={type} value={type}>{emoji} {label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Aankoopprijs</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#6B7280' }}>€</span>
                      <input type="number" min="0" className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm outline-none" style={inpStyle} placeholder="350.000" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Aankoopdatum</label>
                    <input type="date" className={inp} style={inpStyle} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleSkip} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                  Overslaan
                </button>
                <button
                  onClick={() => setStep(2)}
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
          )}

          {/* ── Step 2: Project type ────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-5 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Wat ga je verbouwen?</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Selecteer alles wat van toepassing is</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {projectTypes.map(({ type, label, emoji }) => {
                  const selected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className="rounded-2xl p-3 sm:p-5 border-2 text-center transition-all relative"
                      style={{
                        borderColor: selected ? '#288760' : '#E5E7EB',
                        backgroundColor: selected ? '#F0FAF5' : '#FFFFFF',
                        boxShadow: selected ? '0 0 0 3px rgba(40,135,96,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#288760' }}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div className="text-3xl mb-2">{emoji}</div>
                      <div className="text-sm font-semibold" style={{ color: selected ? '#288760' : '#1A1A1A' }}>{label}</div>
                    </button>
                  );
                })}
              </div>

              {selectedTypes.length > 0 && (
                <p className="text-center text-sm mb-4" style={{ color: '#288760' }}>
                  ✓ {selectedTypes.length === 1
                    ? projectTypes.find((t) => t.type === selectedTypes[0])?.label
                    : `${selectedTypes.length} typen geselecteerd`}
                </p>
              )}

              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                  Terug
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                    Overslaan
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedTypes.length === 0}
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
            </div>
          )}

          {/* ── Step 3: Project details ─────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="text-center mb-5 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Eerste project</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Vertel ons meer over je verbouwing.</p>
              </div>

              <div className="rounded-2xl p-4 sm:p-6 bg-white border space-y-5" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                    Project naam <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bijv. Badkamer renovatie begane grond"
                    value={projectNaam}
                    onChange={(e) => setProjectNaam(e.target.value)}
                    className={inp}
                    style={inpStyle}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Totaal budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#6B7280' }}>€</span>
                    <input type="number" placeholder="15.000" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm outline-none" style={inpStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Startdatum</label>
                    <input type="date" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} className={inp} style={inpStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Verwachte einddatum</label>
                    <input type="date" value={eindDatum} onChange={(e) => setEindDatum(e.target.value)} className={inp} style={inpStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                  Terug
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(4)} className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                    Overslaan
                  </button>
                  <button
                    onClick={() => setStep(4)}
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
            </div>
          )}

          {/* ── Step 4: App tour ───────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div className="text-center mb-5 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Klaar om te beginnen! 🎉</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Wat je allemaal kunt doen in Renofloww.</p>
              </div>

              <div className="rounded-2xl p-5 sm:p-8 bg-white border text-center mb-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: '200px' }}>
                <div className="text-5xl mb-4">{tourSlides[tourSlide].icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1A1A1A' }}>{tourSlides[tourSlide].title}</h3>
                <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: '#6B7280' }}>{tourSlides[tourSlide].description}</p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {tourSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourSlide(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: tourSlide === i ? '#288760' : '#E5E7EB', transform: tourSlide === i ? 'scale(1.3)' : 'scale(1)' }}
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
                  onClick={() => { if (tourSlide > 0) setTourSlide(tourSlide - 1); else setStep(3); }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold border"
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
                    {loading ? 'Bezig...' : 'Naar mijn dashboard 🚀'}
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
