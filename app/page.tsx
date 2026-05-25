import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Renofloww — Verbouw zonder stress',
  description:
    'Houd de controle over je verbouwing. Budget, aannemers, offertes en planning — alles op één plek.',
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
    description: 'Altijd weten wat je nog over hebt. Voeg kosten toe per categorie en zie real-time je resterende budget.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Aannemers beheer',
    description: 'Al je contacten op één plek. Sla namen, telefoonnummers en specialiteiten op per project.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Offerte vergelijker',
    description: 'Vergelijk offertes naast elkaar. Zie direct wie de beste prijs biedt voor jouw verbouwing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'AI assistent',
    description: 'Stel elke vraag over je verbouwing. Onze AI kent jouw project en geeft persoonlijk advies.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Foto dagboek',
    description: "Documenteer elke fase van je verbouwing. Maak voor-, tijdens- en na-foto's per ruimte.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Kalender',
    description: 'Nooit een deadline missen. Plan taken en herinneringen en houd overzicht op je planning.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Maak je project aan',
    description: 'Geef je verbouwing een naam, kies het type (keuken, badkamer, etc.) en stel je totaalbudget in.',
  },
  {
    number: '02',
    title: 'Voeg aannemers, offertes en kosten toe',
    description: 'Houd bij wie er aan het werk is, vergelijk offertes en registreer elke uitgave per categorie.',
  },
  {
    number: '03',
    title: 'Houd controle met realtime overzicht en AI',
    description: 'Zie in één oogopslag hoe je project ervoor staat en stel vragen aan onze AI assistent.',
  },
];

const reviews = [
  {
    name: 'Marieke de Vries',
    location: 'Amsterdam',
    project: 'Badkamer renovatie',
    text: 'Eindelijk een app die écht helpt bij het bijhouden van mijn verbouwing. De budget tracker heeft me al twee keer gewaarschuwd voordat ik over mijn budget ging.',
    rating: 5,
  },
  {
    name: 'Thomas Bakker',
    location: 'Rotterdam',
    project: 'Complete keukenrenovatie',
    text: 'Het vergelijken van offertes is geweldig. Ik had drie aannemers en kon hun offertes direct naast elkaar zien. Scheelt enorm veel tijd en stress.',
    rating: 5,
  },
  {
    name: 'Sandra Hendriks',
    location: 'Utrecht',
    project: 'Woonkamer uitbreiding',
    text: 'De AI assistent is ongelofelijk handig. Ik vroeg of ik een vergunning nodig had voor mijn dakkapel en kreeg direct een duidelijk antwoord.',
    rating: 5,
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
    question: 'Kan ik meerdere verbouwingen tegelijk beheren?',
    answer: 'Met Pro kun je onbeperkt projecten aanmaken en beheren. Handig als je meerdere kamers tegelijk verbouwt of een aannemer bent die meerdere projecten beheert.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAF9', fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#288760' }}>
                R
              </div>
              <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>Renofloww</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#functies" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>Functies</a>
              <a href="#prijzen" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>Prijzen</a>
              <Link href="/login" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#6B7280' }}>Inloggen</Link>
            </div>

            <Link
              href="/register"
              className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#288760' }}
            >
              Gratis proberen
            </Link>

            <Link
              href="/register"
              className="md:hidden inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#288760' }}
            >
              Probeer gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#288760' }}></span>
                14 dagen gratis proberen
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6" style={{ color: '#1A1A1A' }}>
                Verbouw<br />
                <span style={{ color: '#288760' }}>zonder stress</span>
              </h1>
              <p className="text-xl mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
                Houd de controle over je verbouwing. Budget, aannemers, offertes en planning — alles op één plek.
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
                  Bekijk een voorbeeld
                </a>
              </div>
              <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
                Geen creditcard vereist · Opzeggen wanneer je wilt
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#E5E7EB', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ backgroundColor: '#1A5140', borderColor: '#288760' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                  <div className="ml-2 flex-1 bg-white/10 rounded text-xs text-white/60 px-2 py-0.5">renofloww.nl/dashboard</div>
                </div>
                <div className="p-6" style={{ background: 'linear-gradient(135deg, #1A5140 0%, #288760 50%, #5CA87C 100%)' }}>
                  <div className="text-white mb-4">
                    <p className="text-sm opacity-70">Goedemorgen, Marieke</p>
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
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    <div className="flex justify-between text-white text-sm mb-2">
                      <span>Budget</span>
                      <span>€8.500 / €13.200</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="h-2 rounded-full" style={{ width: '64%', backgroundColor: '#B7E5BA' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 rounded-xl p-3 shadow-lg" style={{ backgroundColor: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: '#B7E5BA' }}>💬</div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>AI Assistent</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Vraag alles over je verbouwing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="functies" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Alles wat je nodig hebt</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Van budget tot foto dagboek — Renofloww heeft alle tools voor een succesvolle verbouwing.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-6 border bg-white transition-shadow hover:shadow-md"
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

      {/* How it works */}
      <section className="py-20" style={{ backgroundColor: '#1A5140' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Hoe het werkt</h2>
            <p className="text-lg" style={{ color: '#B7E5BA' }}>In drie stappen je verbouwing onder controle</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex w-16 h-16 rounded-full items-center justify-center text-xl font-bold mb-6" style={{ backgroundColor: '#288760', color: 'white' }}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#B7E5BA' }}>{step.description}</p>
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

            {/* Pro */}
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
                {['Onbeperkt projecten', 'Budget tracker', 'Aannemers & offertes', 'AI assistent', 'Foto dagboek', 'Kalender & herinneringen', 'Analytics & rapportages'].map((item) => (
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

      {/* Social Proof */}
      <section className="py-20" style={{ backgroundColor: '#F8FAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Wat gebruikers zeggen</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Duizenden Nederlanders verbouwen al zonder stress</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#F59E0B' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#1A1A1A' }}>"{review.text}"</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{review.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{review.location} · {review.project}</p>
                </div>
              </div>
            ))}
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
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold bg-white transition-opacity hover:opacity-90"
            style={{ color: '#288760' }}
          >
            Gratis starten
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#1A5140' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-white/20">
                R
              </div>
              <span className="font-bold text-lg text-white">Renofloww</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#functies" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Functies</a>
              <a href="#prijzen" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Prijzen</a>
              <Link href="/login" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Inloggen</Link>
              <Link href="/register" className="text-sm transition-opacity hover:opacity-80" style={{ color: '#B7E5BA' }}>Registreren</Link>
            </div>
            <p className="text-sm" style={{ color: '#5CA87C' }}>© 2025 Renofloww. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
