import type { Metadata } from 'next';
import Link from 'next/link';
import RenoflowwLogo from '@/components/RenoflowwLogo';

export const metadata: Metadata = {
  title: 'Renofloww — Verbouw zonder stress',
  description:
    'Houd de controle over je verbouwing. Budget, aannemers, offertes, Gantt planning en AI assistent — alles op één plek.',
  openGraph: {
    title: 'Renofloww — Verbouw zonder stress',
    description: 'Houd de controle over je verbouwing.',
    type: 'website',
    locale: 'nl_NL',
  },
};

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Budget tracker',
    description: 'Voeg kosten toe per categorie en zie real-time je resterende budget. Nooit meer verrassingen aan het einde van de verbouwing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Gantt planning',
    description: 'Visualiseer je hele verbouwing op een tijdlijn. Zie taken, deadlines en voortgang in één oogopslag — nooit meer een fase vergeten.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Offerte vergelijker',
    description: 'Voeg offertes toe en vergelijk ze direct naast elkaar. Zie wie de beste prijs biedt en sla je keuze op per project.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Aannemers beheer',
    description: 'Al je contacten op één plek. Sla namen, telefoonnummers en specialiteiten op per project — altijd snel de juiste aannemer bereiken.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Foto dagboek',
    description: "Documenteer elke fase van je verbouwing. Maak voor-, tijdens- en na-foto's per ruimte en volg de transformatie stap voor stap.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & streak',
    description: 'Diepgaande rapportages over je project. Budget vs. werkelijk, ruimte-voortgang en een dagelijkse streak om je gemotiveerd te houden.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Maak je project aan',
    description: 'Geef je verbouwing een naam, kies het type — keuken, badkamer, uitbouw of iets anders — en stel meteen je totaalbudget in. Binnen een paar klikken staat je project klaar om mee te werken.',
  },
  {
    number: '02',
    title: 'Plan, voeg toe en vergelijk',
    description: 'Bouw een Gantt planning per ruimte, voeg je aannemers en hun offertes toe en vergelijk ze direct naast elkaar. Registreer elke uitgave per categorie zodat je nooit het overzicht kwijtraakt.',
  },
  {
    number: '03',
    title: 'Houd controle met AI en analytics',
    description: 'Stel vragen aan de AI assistent die jouw project door en door kent, en bekijk realtime rapportages over budget, voortgang en openstaande taken — altijd actueel, altijd binnen handbereik.',
  },
];

const faqs = [
  {
    question: 'Is Renofloww gratis te proberen?',
    answer: 'Ja! Je krijgt 14 dagen gratis toegang tot alle Pro functies. Na je proefperiode kun je kiezen voor een gratis beperkte versie of upgraden naar Pro.',
  },
  {
    question: 'Hoe veilig zijn mijn gegevens?',
    answer: 'Je gegevens worden opgeslagen via Supabase met end-to-end encryptie. We verkopen nooit jouw gegevens aan derden. Je kunt je account op elk moment verwijderen.',
  },
  {
    question: 'Kan ik Renofloww op mijn telefoon gebruiken?',
    answer: 'Ja, Renofloww is volledig responsief en werkt op alle apparaten. Je kunt de app ook installeren als webapp op je telefoon voor de beste ervaring.',
  },
  {
    question: 'Wat zijn de beperkingen van het gratis abonnement?',
    answer: 'Met het gratis abonnement heb je alleen-lezen toegang tot je gegevens. Je kunt geen nieuwe projecten aanmaken of gegevens bewerken, maar je data blijft bewaard.',
  },
  {
    question: 'Wat kan de AI assistent allemaal?',
    answer: 'De AI kent jouw project volledig — budget, taken, ruimtes, aannemers en offertes. Je kunt vragen stellen over vergunningen, materiaalkosten, tips voor aannemers of gewoon advies over de planning.',
  },
  {
    question: 'Kan ik meerdere verbouwingen tegelijk beheren?',
    answer: 'Met Pro kun je onbeperkt projecten aanmaken en beheren. Handig als je meerdere kamers tegelijk verbouwt of een aannemer bent die meerdere projecten beheert.',
  },
];

// AI conversation mock data
const aiMessages = [
  { role: 'user', text: 'Hoeveel heb ik dit weekend uitgegeven aan de keuken?' },
  { role: 'ai', text: 'Dit weekend heb je €1.840 uitgegeven aan de keuken: €1.200 voor de nieuwe tegels bij Gamma en €640 voor het beglazingwerk van De Vries Glas.' },
  { role: 'user', text: 'Heb ik nog budget over voor de keukenkasten?' },
  { role: 'ai', text: 'Je keukenbudget is €12.000 en je hebt nu €7.340 uitgegeven — er is nog €4.660 beschikbaar. Dat is genoeg voor de kasten als je binnen dat bedrag blijft.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAF9', fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <RenoflowwLogo variant="icon" size="sm" />
              <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>Renofloww</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#functies" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>Functies</a>
              <a href="#ai" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>AI assistent</a>
              <a href="#prijzen" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>Prijzen</a>
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              >
                Inloggen
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#288760' }}
              >
                Gratis proberen
              </Link>
            </div>

            {/* Mobile buttons */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold"
                style={{ color: '#288760' }}
              >
                Inloggen
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#288760' }}
              >
                Probeer gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(40,135,96,0.06) 0%, transparent 60%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#288760' }}></span>
                14 dagen gratis proberen
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6" style={{ color: '#1A1A1A' }}>
                Stop met gissen.<br />
                <span style={{ color: '#288760' }}>Begin met Renofloww.</span>
              </h1>
              <p className="text-xl mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
                Budget, aannemers, planning en AI — alles voor jouw verbouwing op één plek.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#288760' }}
                >
                  Gratis 14 dagen proberen
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#functies"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold border transition-colors hover:bg-white"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                >
                  Bekijk alle functies
                </a>
              </div>
              <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
                Geen creditcard vereist · Direct opzegbaar
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#E5E7EB', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
                {/* browser chrome */}
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ backgroundColor: '#1A5140', borderColor: '#288760' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                  <div className="ml-2 flex-1 bg-white/10 rounded text-xs text-white/60 px-2 py-0.5">renofloww.nl/dashboard</div>
                </div>
                {/* dashboard mockup */}
                <div className="p-6" style={{ background: 'linear-gradient(135deg, #1A5140 0%, #288760 50%, #5CA87C 100%)' }}>
                  <div className="text-white mb-4">
                    <p className="text-sm opacity-70">Goedemiddag, Marieke</p>
                    <p className="text-xl font-bold">Badkamer renovatie</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Budget gebruikt', value: '64%' },
                      { label: 'Taken vandaag', value: '3' },
                      { label: 'Openst. offertes', value: '2' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-white/70">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* mini gantt */}
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    <p className="text-white text-xs font-medium mb-3 opacity-80">Gantt planning</p>
                    {[
                      { label: 'Sloop',   pct: 100, done: true,  start: '1 mei',  end: '10 mei' },
                      { label: 'Tegels',  pct: 65,  done: false, start: '11 mei', end: '25 mei' },
                      { label: 'Sanitair',pct: 20,  done: false, start: '20 mei', end: '5 jun'  },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-2 mb-2.5 last:mb-0">
                        <span className="text-white/70 text-xs w-12 shrink-0">{row.label}</span>
                        <div className="flex-1 rounded-full h-5 relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          <div
                            className="h-full rounded-full flex items-center justify-between px-2"
                            style={{ width: `${row.pct}%`, backgroundColor: row.done ? '#5CA87C' : 'rgba(255,255,255,0.55)', minWidth: 80 }}
                          >
                            <span className="text-[9px] font-semibold leading-none" style={{ color: row.done ? 'white' : '#1A5140' }}>{row.start}</span>
                            <span className="text-[9px] font-semibold leading-none" style={{ color: row.done ? 'white' : '#1A5140' }}>{row.end}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* floating AI chip */}
              <div className="absolute -bottom-4 -left-4 rounded-xl p-3 shadow-lg" style={{ backgroundColor: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#B7E5BA' }}>✨</div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>AI Assistent</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Kent jouw project volledig</p>
                  </div>
                </div>
              </div>

              {/* floating streak chip */}
              <div className="absolute -top-3 -right-3 rounded-xl px-3 py-2 shadow-lg" style={{ backgroundColor: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>12 dagen streak</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Blijf consistent!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-sm" style={{ color: '#6B7280' }}>
            <span>14 dagen gratis proberen</span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span>Geen creditcard vereist</span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span>Opgezet in 5 minuten</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="functies" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Alles wat je nodig hebt</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Van Gantt planning tot AI assistent — Renofloww heeft alle tools voor een succesvolle verbouwing.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-6 border bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Spotlight */}
      <section id="ai" className="py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F3323 0%, #1A5140 40%, #1E6048 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(183,229,186,0.15)', color: '#B7E5BA', border: '1px solid rgba(183,229,186,0.25)' }}>
                <span className="text-base">✨</span>
                AI assistent
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Een assistent die<br />
                <span style={{ color: '#B7E5BA' }}>jouw project kent</span>
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Onze AI is gekoppeld aan al je projectdata — budget, taken, offertes, aannemers en ruimtes. Stel elke vraag en krijg direct een antwoord dat klopt met jouw situatie.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: '💬', title: 'Stel elke vraag', desc: 'Over vergunningen, materialen, kosten of planning — de AI weet het antwoord.' },
                  { icon: '📊', title: 'Realtime inzicht', desc: 'Vraag je saldo op, welke taken er openstaan of hoe je budget er voorstaat.' },
                  { icon: '🔍', title: 'Slim advies', desc: 'De AI vergelijkt je offertes, signaleert risico\'s en geeft praktisch advies.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#288760', color: 'white' }}
              >
                Probeer de AI gratis
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Right: chat mockup */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0A2518', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* chat header */}
                <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0F3323' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #288760, #5CA87C)' }}>
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Renofloww AI</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Kent je project · Altijd beschikbaar</p>
                    </div>
                  </div>
                </div>

                {/* messages */}
                <div className="p-5 space-y-4">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-xs" style={{ background: 'linear-gradient(135deg, #288760, #5CA87C)' }}>
                          ✨
                        </div>
                      )}
                      <div
                        className="px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-xs"
                        style={msg.role === 'user'
                          ? { backgroundColor: '#288760', color: 'white', borderBottomRightRadius: 4 }
                          : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)', borderBottomLeftRadius: 4 }
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* typing indicator */}
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs" style={{ background: 'linear-gradient(135deg, #288760, #5CA87C)' }}>
                      ✨
                    </div>
                    <div className="px-4 py-3 rounded-2xl flex items-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255,255,255,0.4)', animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255,255,255,0.4)', animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255,255,255,0.4)', animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>

                {/* input bar */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Stel een vraag over je verbouwing...</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#288760' }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* glow effect */}
              <div className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-2xl" style={{ background: 'radial-gradient(ellipse, #288760 0%, transparent 70%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 sm:py-32" style={{ backgroundColor: '#1A5140' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-4">Hoe het werkt</h2>
            <p className="text-lg" style={{ color: '#B7E5BA' }}>In drie stappen je verbouwing onder controle</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex w-20 h-20 rounded-full items-center justify-center text-3xl font-bold mb-8" style={{ backgroundColor: '#288760', color: 'white' }}>
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-base leading-relaxed max-w-sm mx-auto" style={{ color: '#B7E5BA' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="prijzen" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Eenvoudige prijzen</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Begin gratis, upgrade wanneer je meer nodig hebt</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl p-6 border bg-white" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Gratis</h3>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Na je proefperiode</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ color: '#1A1A1A' }}>€0</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>/maand</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {['Alleen-lezen toegang', 'Data blijft bewaard', 'Max. 1 project', 'Geen AI assistent', 'Geen nieuwe invoer'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                Begin gratis
              </Link>
            </div>

            {/* Pro Monthly */}
            <div className="rounded-2xl p-6 border-2 relative" style={{ borderColor: '#288760', backgroundColor: '#F8FAF9', boxShadow: '0 8px 32px rgba(40,135,96,0.15)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#288760' }}>Meest gekozen</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Pro</h3>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Voor de serieuze verbouwer</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ color: '#288760' }}>€9,99</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>/maand</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'Onbeperkt projecten',
                  'Budget tracker & analytics',
                  'Gantt planning',
                  'Aannemers & offerte vergelijker',
                  'AI assistent',
                  'Foto dagboek per ruimte',
                  'Streak & voortgangsrapportage',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#288760' }}>
                14 dagen gratis proberen
              </Link>
            </div>

            {/* Yearly */}
            <div className="rounded-2xl p-6 border bg-white relative" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>2 maanden gratis</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Jaarlijks</h3>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Bespaar €40 per jaar</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ color: '#1A1A1A' }}>€79</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>/jaar</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>€6,58/maand</p>
              </div>
              <ul className="space-y-3 mb-6">
                {['Alles van Pro', '2 maanden gratis', 'Prioriteit support', 'Vroege toegang tot nieuwe functies'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#1A1A1A' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: '#288760', color: '#288760' }}>
                Jaarlijks starten
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Veelgestelde vragen</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border p-6" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>{faq.question}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20" style={{ backgroundColor: '#288760' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Klaar om te beginnen?</h2>
          <p className="text-lg mb-8" style={{ color: '#B7E5BA' }}>
            Probeer Renofloww 14 dagen gratis. Geen creditcard vereist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-5 rounded-xl text-lg font-bold bg-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ color: '#1A5140', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              Gratis starten
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold transition-opacity hover:opacity-80"
              style={{ color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              Al een account? Inloggen
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#1A5140' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <RenoflowwLogo variant="icon" size="sm" textColor="white" />
              <span className="font-bold text-lg text-white">Renofloww</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a href="#functies" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Functies</a>
              <a href="#ai" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>AI assistent</a>
              <a href="#prijzen" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Prijzen</a>
              <Link href="/login" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Inloggen</Link>
              <Link href="/register" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Registreren</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <p className="text-sm text-center" style={{ color: '#5CA87C' }}>© 2026 Renofloww (Sharply, KVK 76336840). Alle rechten voorbehouden.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/privacy" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Privacybeleid</Link>
              <Link href="/voorwaarden" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Algemene voorwaarden</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
