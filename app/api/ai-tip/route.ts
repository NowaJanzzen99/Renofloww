import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budgetPct, todayTaskCount, nextDeadline, openQuotes, endDate, projectType, projectId } = body;

    const contextParts: string[] = [];
    if (budgetPct != null)     contextParts.push(`Budget: ${budgetPct}% gebruikt`);
    if (todayTaskCount != null) contextParts.push(`${todayTaskCount} taken gepland vandaag`);
    if (openQuotes != null && openQuotes > 0) contextParts.push(`${openQuotes} open offerte${openQuotes > 1 ? 's' : ''}`);
    if (nextDeadline)          contextParts.push(`Volgende deadline: ${nextDeadline}`);
    if (endDate)               contextParts.push(`Einddatum project: ${endDate}`);
    if (projectType)           contextParts.push(`Type project: ${projectType}`);

    const userMessage = contextParts.length > 0
      ? contextParts.join(', ') + '.'
      : 'Geen specifieke projectdata beschikbaar.';

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 120,
      system: `Je bent een renovatieassistent voor Renofloww. Geef een JSON object terug (geen andere tekst) met twee velden:
- "tip": precies 1 korte Nederlandse zin (max 15 woorden) als praktische tip
- "action": één van deze strings op basis van het onderwerp van de tip: "taken", "budget", "planning", "offertes", "kosten", of null als niet van toepassing

Voorbeeld: {"tip":"Plan je schilder vroeg in om vertragingen te voorkomen.","action":"planning"}
Alleen geldig JSON, geen markdown.`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    let tip = '';
    let action: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      tip = parsed.tip ?? '';
      action = parsed.action ?? null;
    } catch {
      // Fallback: treat full response as plain tip
      tip = raw.replace(/^\{.*"tip"\s*:\s*"/, '').replace(/".*\}$/, '').trim();
    }

    // Map action keyword to href
    const actionMap: Record<string, { label: string; href: string }> = {
      taken:     { label: 'Bekijk taken →',     href: projectId ? `/projects/${projectId}?tab=taken`     : '/projects' },
      budget:    { label: 'Bekijk budget →',    href: projectId ? `/projects/${projectId}?tab=kosten`    : '/projects' },
      planning:  { label: 'Bekijk planning →',  href: projectId ? `/projects/${projectId}?tab=overzicht` : '/projects' },
      offertes:  { label: 'Bekijk offertes →',  href: projectId ? `/projects/${projectId}?tab=offertes`  : '/projects' },
      kosten:    { label: 'Bekijk kosten →',    href: '/woningkosten' },
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
