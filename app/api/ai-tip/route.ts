import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId, projectName, projectType,
      budgetPct, budgetLeft, totalSpent, totalBudget,
      todayTaskCount, todayTaskNames, todayCompletedCount,
      overdueTaskCount, overdueTaskNames,
      openTaskCount, openQuotes,
      nextDeadlineName, nextDeadlineDays,
      projectEndDays,
      topExpenseCategory,
      currentStreak, roomCount,
    } = body;

    // Bouw een gestructureerde context op met alle beschikbare data
    const lines: string[] = [];

    if (projectName) lines.push(`Project: "${projectName}" (${projectType ?? 'verbouwing'})`);

    if (budgetPct != null && totalBudget != null)
      lines.push(`Budget: ${budgetPct}% gebruikt — €${Math.round(totalSpent ?? 0).toLocaleString('nl-NL')} van €${Math.round(totalBudget).toLocaleString('nl-NL')} — €${Math.round(budgetLeft ?? 0).toLocaleString('nl-NL')} over`);

    if (todayTaskCount != null) {
      const names = todayTaskNames?.length ? ` (${todayTaskNames.join(', ')})` : '';
      lines.push(`Vandaag: ${todayCompletedCount ?? 0}/${todayTaskCount} taken gedaan${names}`);
    }

    if (overdueTaskCount > 0) {
      const names = overdueTaskNames?.length ? `: ${overdueTaskNames.join(', ')}` : '';
      lines.push(`Achterstallig: ${overdueTaskCount} taken te laat${names}`);
    }

    if (openTaskCount != null) lines.push(`Totaal openstaand: ${openTaskCount} taken`);
    if (openQuotes > 0)        lines.push(`${openQuotes} offerte${openQuotes > 1 ? 's' : ''} wacht op reactie`);

    if (nextDeadlineName && nextDeadlineDays != null)
      lines.push(`Volgende deadline: "${nextDeadlineName}" over ${nextDeadlineDays} dag${nextDeadlineDays === 1 ? '' : 'en'}`);

    if (projectEndDays != null)
      lines.push(`Project eindigt over ${projectEndDays} dag${projectEndDays === 1 ? '' : 'en'}`);

    if (topExpenseCategory) lines.push(`Grootste uitgavepost: ${topExpenseCategory}`);
    if (roomCount > 0)      lines.push(`${roomCount} ruimte${roomCount === 1 ? '' : 'n'} in planning`);
    if (currentStreak > 0)  lines.push(`Huidige streak: ${currentStreak} dag${currentStreak === 1 ? '' : 'en'}`);

    const context = lines.length > 0 ? lines.join('\n') : 'Geen projectdata beschikbaar.';

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      system: `Je bent een slimme renovatieassistent voor Renofloww. Je geeft SPECIFIEKE, ACTIEGERICHTE tips op basis van de ECHTE data van de gebruiker.

REGELS:
- Gebruik altijd de specifieke getallen, namen of datums uit de context
- Geen algemene adviezen zoals "plan vroeg" of "houd budget bij" — die zijn nutteloos
- De tip moet kloppen met de situatie: als het budget bijna op is, zeg dat; als er achterstallige taken zijn, noem ze bij naam; als een deadline nadert, noem het exacte aantal dagen
- Max 18 woorden voor de tip
- Schrijf in het Nederlands, directe toon

Geef een JSON object terug (geen andere tekst):
{"tip": "<specifieke tip op basis van de data>", "action": "<taken|budget|planning|offertes|kosten|null>"}

Voorbeelden van GOEDE tips:
- "Je hebt nog €3.200 budget over — gebruik dit voor de afwerking."
- "Schilderwerk staat al 4 dagen open — plan dit vandaag in."
- "Deadline badkamer is over 8 dagen, maar nog 3 taken open."
- "85% van je budget is al op — rem op materiaalkosten."

Voorbeelden van SLECHTE tips (niet doen):
- "Plan je schilder vroeg in om vertragingen te voorkomen."
- "Houd je budget goed bij."
- "Zorg dat je deadlines haalt."`,
      messages: [{ role: 'user', content: context }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    const raw = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let tip = '';
    let action: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      tip = parsed.tip ?? '';
      action = parsed.action ?? null;
    } catch {
      tip = raw.replace(/^\{.*"tip"\s*:\s*"/, '').replace(/".*\}$/, '').trim();
    }

    const actionMap: Record<string, { label: string; href: string }> = {
      taken:    { label: 'Bekijk taken →',    href: projectId ? `/projects/${projectId}?tab=taken`     : '/projects' },
      budget:   { label: 'Bekijk budget →',   href: projectId ? `/projects/${projectId}?tab=kosten`    : '/projects' },
      planning: { label: 'Bekijk planning →', href: projectId ? `/projects/${projectId}?tab=overzicht` : '/projects' },
      offertes: { label: 'Bekijk offertes →', href: projectId ? `/projects/${projectId}?tab=offertes`  : '/projects' },
      kosten:   { label: 'Bekijk kosten →',   href: '/woningkosten' },
    };

    return NextResponse.json({
      tip,
      actionLink: action && actionMap[action] ? actionMap[action] : null,
    });
  } catch (err) {
    console.error('AI tip error:', err);
    return NextResponse.json({ tip: null, actionLink: null, error: 'Tip tijdelijk niet beschikbaar.' }, { status: 500 });
  }
}
