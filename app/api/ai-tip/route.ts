import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budgetPct, todayTaskCount, nextDeadline, openQuotes, endDate, projectType } = body;

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
      system:
        'Je bent een slimme renovatieassistent voor Renofloww. Geef één korte, praktische tip of observatie in maximaal 2 zinnen op basis van de projectdata. Wees specifiek en behulpzaam, niet generiek. Reageer alleen in het Nederlands.',
      messages: [{ role: 'user', content: userMessage }],
    });

    const tip =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    return NextResponse.json({ tip });
  } catch (err) {
    console.error('AI tip error:', err);
    return NextResponse.json({ tip: null, error: 'Tip tijdelijk niet beschikbaar.' }, { status: 500 });
  }
}
