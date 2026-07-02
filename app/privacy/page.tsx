import Link from 'next/link';
import RenoflowwLogo from '@/components/RenoflowwLogo';

export const metadata = {
  title: 'Privacybeleid',
  description: 'Privacybeleid van Renofloww — hoe wij omgaan met jouw persoonsgegevens.',
};

const LAST_UPDATED = '2 juli 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-3" style={{ color: '#1A1A1A' }}>{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed" style={{ color: '#374151' }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <header className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/"><RenoflowwLogo variant="full" size="sm" textColor="dark" /></Link>
          <Link href="/" className="text-sm font-medium" style={{ color: '#288760' }}>← Terug naar home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Privacybeleid</h1>
        <p className="text-sm mb-10" style={{ color: '#6B7280' }}>Laatst bijgewerkt: {LAST_UPDATED}</p>

        <Section title="1. Wie zijn wij">
          <p>
            Renofloww is een dienst van <strong>Sharply</strong>, ingeschreven bij de Kamer van
            Koophandel onder nummer <strong>76336840</strong>, gevestigd aan Hamstraat 36 A, 6041HC
            Roermond. In dit privacybeleid noemen wij onszelf &quot;wij&quot; of &quot;Renofloww&quot;.
          </p>
          <p>
            Voor alle vragen over privacy en de verwerking van jouw persoonsgegevens kun je contact
            opnemen via <a href="mailto:support.renofloww@gmail.com" className="underline" style={{ color: '#288760' }}>support.renofloww@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. Welke gegevens verwerken wij">
          <p>Wij verwerken de volgende persoonsgegevens, afhankelijk van hoe je Renofloww gebruikt:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Accountgegevens:</strong> naam, e-mailadres, profielfoto (indien opgegeven) en wachtwoord (versleuteld opgeslagen).</li>
            <li><strong>Woninggegevens:</strong> adres, postcode, woningtype, oppervlakte, aankoopprijs en aankoopdatum van de woning(en) die je toevoegt.</li>
            <li><strong>Projectgegevens:</strong> namen, omschrijvingen, budgetten, planningen en statussen van jouw renovatieprojecten en ruimtes.</li>
            <li><strong>Financiële gegevens binnen de app:</strong> uitgaven, kostencategorieën, offertes en facturen die je zelf invoert of uploadt.</li>
            <li><strong>Documenten en foto&apos;s:</strong> bestanden die je uploadt bij projecten, offertes of ruimtes.</li>
            <li><strong>Taken en herinneringen:</strong> door jou aangemaakte taken, deadlines en meldingsvoorkeuren.</li>
            <li><strong>Betaalgegevens:</strong> Stripe-klant- en abonnements-ID (de daadwerkelijke betaalgegevens, zoals je kaartnummer, worden nooit door ons opgeslagen — zie punt 4).</li>
            <li><strong>Gebruiksgegevens:</strong> technische logs (zoals IP-adres en tijdstip van inloggen) die noodzakelijk zijn voor de beveiliging van je account.</li>
          </ul>
        </Section>

        <Section title="3. Waarvoor gebruiken wij jouw gegevens">
          <ul className="list-disc pl-5 space-y-1">
            <li>Het aanbieden en laten functioneren van je account en de kernfunctionaliteit van Renofloww (projecten, budget, planning, taken).</li>
            <li>Het verwerken van je abonnement en betalingen via Stripe.</li>
            <li>Het genereren van gepersonaliseerde AI-adviezen op basis van je projectdata (zie punt 5).</li>
            <li>Het versturen van functionele meldingen (bijv. deadline-herinneringen), voor zover je dat hebt ingesteld.</li>
            <li>Het onderhouden en beveiligen van de dienst, waaronder het opsporen van misbruik.</li>
            <li>Het voldoen aan wettelijke verplichtingen (bijv. fiscale bewaarplicht van facturen).</li>
          </ul>
          <p>
            Wij verkopen jouw gegevens nooit aan derden en gebruiken ze niet voor advertentiedoeleinden.
          </p>
        </Section>

        <Section title="4. Grondslag voor de verwerking">
          <p>
            Wij verwerken jouw gegevens op basis van: (a) de uitvoering van de overeenkomst die je
            met ons aangaat door een account te maken, (b) ons gerechtvaardigd belang bij het
            verbeteren en beveiligen van de dienst, en (c) wettelijke verplichtingen, zoals de
            fiscale bewaarplicht voor facturen.
          </p>
        </Section>

        <Section title="5. Delen met derde partijen">
          <p>Wij schakelen de volgende verwerkers in om Renofloww te kunnen leveren:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase</strong> (database, authenticatie en bestandsopslag) — hier wordt al
              jouw accountdata en projectdata opgeslagen. Supabase verwerkt gegevens conform een
              verwerkersovereenkomst (DPA).
            </li>
            <li>
              <strong>Stripe</strong> (betalingsverwerking) — voor het verwerken van je abonnement
              en betalingen. Stripe ontvangt je betaalgegevens rechtstreeks; wij zien en bewaren
              deze niet zelf.
            </li>
            <li>
              <strong>Anthropic</strong> (AI-adviesfunctie) — om je een persoonlijke tip te kunnen
              geven, sturen wij een beperkte set projectgegevens (zoals projectnaam, budgetcijfers,
              taaknamen en deadlines) naar Anthropic&apos;s Claude-model. Wij sturen hierbij nooit je
              naam, e-mailadres of adresgegevens mee.
            </li>
            <li>
              <strong>Eurostat en de Europese Centrale Bank</strong> — voor publieke marktdata
              (huizenprijsindex, hypotheekrentes) op de woningwaarde-pagina. Hierbij worden geen
              persoonsgegevens verzonden.
            </li>
          </ul>
          <p>
            Wij delen jouw gegevens niet met andere derden, tenzij wij daartoe wettelijk verplicht
            zijn.
          </p>
        </Section>

        <Section title="6. Internationale doorgifte">
          <p>
            Supabase en Stripe verwerken gegevens (mede) binnen de EU. Anthropic is gevestigd in de
            Verenigde Staten; doorgifte van de beperkte projectgegevens die wij delen (zie punt 5)
            vindt plaats op basis van modelcontractbepalingen (Standard Contractual Clauses) die
            passende waarborgen bieden conform de AVG.
          </p>
        </Section>

        <Section title="7. Bewaartermijn">
          <p>
            Wij bewaren jouw gegevens zolang je een account bij ons hebt. Na het verwijderen van je
            account verwijderen wij jouw persoonsgegevens binnen 30 dagen, tenzij we wettelijk
            verplicht zijn bepaalde gegevens (zoals facturen, op grond van de fiscale bewaarplicht
            van 7 jaar) langer te bewaren.
          </p>
        </Section>

        <Section title="8. Jouw rechten">
          <p>Op grond van de AVG heb je het recht om:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>je gegevens in te zien;</li>
            <li>je gegevens te laten corrigeren of aanvullen;</li>
            <li>je gegevens te laten verwijderen;</li>
            <li>je toestemming voor de verwerking in te trekken;</li>
            <li>bezwaar te maken tegen de verwerking van jouw gegevens;</li>
            <li>je gegevens over te laten dragen (dataportabiliteit).</li>
          </ul>
          <p>
            Je kunt hiervoor een verzoek indienen via <a href="mailto:support.renofloww@gmail.com" className="underline" style={{ color: '#288760' }}>support.renofloww@gmail.com</a>.
            Wij reageren binnen vier weken op je verzoek. Ook heb je het recht om een klacht in te
            dienen bij de Autoriteit Persoonsgegevens.
          </p>
        </Section>

        <Section title="9. Beveiliging">
          <p>
            Wij nemen passende technische en organisatorische maatregelen om jouw gegevens te
            beveiligen, waaronder versleutelde opslag van wachtwoorden, toegangscontrole per
            gebruiker op databaseniveau (Row Level Security) en versleutelde verbindingen (HTTPS/TLS)
            voor al het dataverkeer.
          </p>
        </Section>

        <Section title="10. Cookies">
          <p>
            Renofloww gebruikt uitsluitend functionele cookies die noodzakelijk zijn om je
            ingelogd te houden en de dienst te laten werken (via Supabase Authenticatie). Wij
            plaatsen geen tracking- of advertentiecookies en gebruiken geen analytics-tools van
            derden.
          </p>
        </Section>

        <Section title="11. Wijzigingen">
          <p>
            Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De datum bovenaan deze
            pagina geeft aan wanneer het beleid voor het laatst is gewijzigd. Bij ingrijpende
            wijzigingen informeren wij je per e-mail.
          </p>
        </Section>
      </main>
    </div>
  );
}
