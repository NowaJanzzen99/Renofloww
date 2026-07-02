import Link from 'next/link';
import RenoflowwLogo from '@/components/RenoflowwLogo';

export const metadata = {
  title: 'Algemene voorwaarden',
  description: 'Algemene voorwaarden van Renofloww.',
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

export default function VoorwaardenPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      <header className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/"><RenoflowwLogo variant="full" size="sm" textColor="dark" /></Link>
          <Link href="/" className="text-sm font-medium" style={{ color: '#288760' }}>← Terug naar home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Algemene voorwaarden</h1>
        <p className="text-sm mb-10" style={{ color: '#6B7280' }}>Laatst bijgewerkt: {LAST_UPDATED}</p>

        <Section title="1. Wie zijn wij">
          <p>
            Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten met betrekking tot
            het gebruik van Renofloww, een dienst van <strong>Sharply</strong> (eenmanszaak),
            ingeschreven bij de Kamer van Koophandel onder nummer <strong>76336840</strong>,
            gevestigd aan Hamstraat 36 A, 6041HC Roermond, hierna &quot;Renofloww&quot; of
            &quot;wij&quot;. Contact: <a href="mailto:support.renofloww@gmail.com" className="underline" style={{ color: '#288760' }}>support.renofloww@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. Toepasselijkheid">
          <p>
            Deze voorwaarden zijn van toepassing op ieder gebruik van Renofloww, of je nu een gratis
            proefperiode gebruikt of een betaald abonnement hebt. Door een account aan te maken ga
            je akkoord met deze voorwaarden en met ons <Link href="/privacy" className="underline" style={{ color: '#288760' }}>privacybeleid</Link>.
          </p>
        </Section>

        <Section title="3. De dienst">
          <p>
            Renofloww is een webapplicatie waarmee gebruikers hun woningrenovatie kunnen plannen en
            beheren, waaronder budgetbeheer, planning, takenbeheer, offertes en een AI-adviesfunctie.
            Renofloww is een hulpmiddel voor administratie en planning; de AI-tips zijn algemene,
            geautomatiseerde suggesties en vormen geen professioneel bouwkundig, financieel of
            juridisch advies. Beslissingen over jouw verbouwing blijven te allen tijde jouw eigen
            verantwoordelijkheid.
          </p>
        </Section>

        <Section title="4. Account en proefperiode">
          <ul className="list-disc pl-5 space-y-1">
            <li>Om Renofloww te gebruiken maak je een account aan met een geldig e-mailadres.</li>
            <li>Je bent zelf verantwoordelijk voor het geheimhouden van je inloggegevens en voor alle activiteit onder je account.</li>
            <li>Nieuwe accounts krijgen een gratis proefperiode. Na afloop van de proefperiode is voortgezet gebruik alleen mogelijk met een betaald abonnement.</li>
            <li>Je moet minimaal 16 jaar oud zijn om een account aan te maken.</li>
          </ul>
        </Section>

        <Section title="5. Abonnement, betaling en opzegging">
          <ul className="list-disc pl-5 space-y-1">
            <li>Wij bieden een maandabonnement en een jaarabonnement aan, verwerkt via onze betaalpartner Stripe. Bij het jaarabonnement wordt het volledige jaarbedrag in één keer bij aanvang van de periode gefactureerd.</li>
            <li>Het abonnement wordt automatisch verlengd voor eenzelfde periode (maand of jaar) totdat je opzegt.</li>
            <li>Je kunt je abonnement op elk moment opzeggen via je accountinstellingen. Bij opzegging blijft je toegang actief tot het einde van de lopende betaalperiode — bij een jaarabonnement dus tot het einde van dat jaar; er vindt geen terugbetaling plaats over de reeds betaalde, nog lopende periode.</li>
            <li>Je abonnement vertegenwoordigt een betalingsverplichting voor de volledige lopende periode (maand of jaar). Het verwijderen van je account ontslaat je niet van deze verplichting: is je abonnement nog niet opgezegd, dan moet je dit eerst doen voordat je je account kunt verwijderen.</li>
            <li>Wij kunnen onze prijzen wijzigen. Prijswijzigingen worden minimaal 30 dagen van tevoren per e-mail aangekondigd en gaan pas in bij je eerstvolgende betaalperiode.</li>
            <li>Bij een mislukte betaling behouden wij ons het recht voor de toegang tot betaalde functionaliteit op te schorten totdat de betaling alsnog is voldaan.</li>
          </ul>
        </Section>

        <Section title="6. Jouw content en gegevens">
          <p>
            Alle gegevens die je in Renofloww invoert (projecten, documenten, foto&apos;s, offertes)
            blijven van jou. Je verleent ons enkel het recht om deze gegevens te verwerken voor
            zover noodzakelijk om de dienst aan jou te leveren, zoals beschreven in ons <Link href="/privacy" className="underline" style={{ color: '#288760' }}>privacybeleid</Link>.
            Je bent zelf verantwoordelijk voor de juistheid van de gegevens die je invoert en voor
            het hebben van de benodigde rechten op geüploade documenten en foto&apos;s.
          </p>
        </Section>

        <Section title="7. Toegestaan gebruik">
          <p>Je gaat ermee akkoord Renofloww niet te gebruiken om:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>de dienst te verstoren, te overbelasten of onbevoegd toegang te zoeken tot systemen of gegevens van anderen;</li>
            <li>illegale, inbreukmakende of schadelijke content te uploaden;</li>
            <li>de dienst te reverse-engineeren, te kopiëren of commercieel door te verkopen zonder onze schriftelijke toestemming.</li>
          </ul>
          <p>
            Bij overtreding kunnen wij je account tijdelijk of permanent blokkeren.
          </p>
        </Section>

        <Section title="8. Beschikbaarheid">
          <p>
            Wij streven naar een zo hoog mogelijke beschikbaarheid van Renofloww, maar garanderen
            geen ononderbroken of foutloze werking. Gepland onderhoud kondigen wij waar mogelijk
            vooraf aan. Marktdata (zoals huizenprijsindices en hypotheekrentes) is afkomstig van
            externe bronnen (Eurostat, ECB) en kan met vertraging of onnauwkeurigheden worden
            weergegeven.
          </p>
        </Section>

        <Section title="9. Aansprakelijkheid">
          <p>
            Renofloww wordt geleverd op basis van &quot;zo goed als mogelijk&quot; (best effort).
            Wij zijn niet aansprakelijk voor schade die voortvloeit uit het gebruik van de dienst,
            waaronder maar niet beperkt tot verkeerde budgetinschattingen, gemiste deadlines, of
            beslissingen die je baseert op de AI-adviesfunctie of getoonde marktdata, tenzij sprake
            is van opzet of bewuste roekeloosheid onze kant. Onze totale aansprakelijkheid is in
            alle gevallen beperkt tot het bedrag dat je in de drie maanden voorafgaand aan de
            schadeveroorzakende gebeurtenis aan ons hebt betaald.
          </p>
        </Section>

        <Section title="10. Beëindiging">
          <p>
            Je kunt je account op elk moment verwijderen via je accountinstellingen of door contact
            met ons op te nemen. Verwijdering is direct en permanent. Heb je op dat moment een actief
            betaald abonnement, dan wordt dit automatisch opgezegd; er vindt geen terugbetaling plaats
            over de reeds lopende betaalperiode, conform artikel 5. Het verwijderen van je account
            schort geen reeds vervallen betalingsverplichtingen op.
          </p>
          <p>
            Wij kunnen je account opschorten of beëindigen bij overtreding van deze voorwaarden, bij
            langdurige inactiviteit van een gratis account, of bij het staken van de dienst — in dat
            laatste geval met een redelijke opzegtermijn en de mogelijkheid om je gegevens te
            exporteren.
          </p>
        </Section>

        <Section title="11. Wijzigingen van deze voorwaarden">
          <p>
            Wij kunnen deze voorwaarden aanpassen. Bij ingrijpende wijzigingen informeren wij je
            minimaal 30 dagen van tevoren per e-mail. Voortgezet gebruik van Renofloww na de
            ingangsdatum van de wijziging geldt als acceptatie van de nieuwe voorwaarden.
          </p>
        </Section>

        <Section title="12. Toepasselijk recht en geschillen">
          <p>
            Op deze voorwaarden en op alle overeenkomsten met Renofloww is Nederlands recht van
            toepassing. Geschillen leggen wij eerst voor aan elkaar om in onderling overleg tot een
            oplossing te komen. Komen we er niet uit, dan is de rechtbank in het arrondissement waar
            Sharply is gevestigd bevoegd, tenzij dwingend consumentenrecht anders bepaalt.
          </p>
        </Section>
      </main>
    </div>
  );
}
