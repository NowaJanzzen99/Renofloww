import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, project_id } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      project_id?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Geen berichten opgegeven' }, { status: 400 });
    }

    // Fetch project context if project_id provided
    let projectContext = '';
    if (project_id) {
      try {
        const [projectRes, contractorsRes, quotesRes, expensesRes, tasksRes] = await Promise.all([
          supabase.from('projects').select('*').eq('id', project_id).single(),
          supabase.from('contractors').select('name, type, specialty').eq('project_id', project_id),
          supabase.from('quotes').select('amount, status, description').eq('project_id', project_id),
          supabase.from('expenses').select('amount, category, description').eq('project_id', project_id),
          supabase.from('tasks').select('title, status, due_date').eq('project_id', project_id).limit(10),
        ]);

        const project = projectRes.data;
        const contractors = contractorsRes.data || [];
        const quotes = quotesRes.data || [];
        const expenses = expensesRes.data || [];
        const tasks = tasksRes.data || [];

        if (project) {
          const totalExpenses = expenses.reduce((sum: number, e: { amount: string | number }) => sum + Number(e.amount), 0);
          const pendingQuotes = quotes.filter((q: { status: string }) => q.status === 'in_behandeling' || q.status === 'pending');

          projectContext = `

Context van het project van de gebruiker:
- Project: ${project.name}, Type: ${project.type}
- Budget: €${project.budget ? Number(project.budget).toLocaleString('nl-NL') : 'niet ingesteld'}
- Besteed: €${totalExpenses.toLocaleString('nl-NL')} (${project.budget ? Math.round((totalExpenses / Number(project.budget)) * 100) : 0}%)
- Status: ${project.status}
- Startdatum: ${project.start_date || 'niet ingesteld'}
- Aannemers: ${contractors.length > 0 ? contractors.map((c: { name: string; type: string }) => `${c.name} (${c.type || 'algemeen'})`).join(', ') : 'geen'}
- Openstaande offertes: ${pendingQuotes.length}
- Recente taken: ${tasks.slice(0, 5).map((t: { title: string; status: string }) => `${t.title} (${t.status})`).join(', ') || 'geen'}`;
        }
      } catch (err) {
        // Project context is optional, continue without it
        console.error('Could not fetch project context:', err);
      }
    }

    const systemPrompt = `Je bent een AI assistent voor Renofloww, een verbouwing management app voor Nederlandse huiseigenaren. Je helpt gebruikers met vragen over hun verbouwing. Spreek altijd Nederlands. Wees praktisch en concreet. Geef specifieke, bruikbare adviezen.

Je kunt helpen met:
- Kostenramingen voor verbouwingen
- Advies over materialen en leveranciers
- Informatie over vergunningen
- Planning en tijdlijn suggesties
- Vragen over aannemers en offertes
- Budget beheer en prioriteiten
${projectContext}`;

    const lastUserMessage = messages[messages.length - 1];
    const conversationHistory = messages.slice(0, -1);

    // Save user message to DB
    await supabase.from('ai_messages').insert({
      user_id: user.id,
      project_id: project_id || null,
      role: 'user',
      content: lastUserMessage.content,
    });

    // Call Anthropic API with streaming
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: lastUserMessage.content },
      ],
    });

    // Stream the response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Save assistant message to DB
          await supabase.from('ai_messages').insert({
            user_id: user.id,
            project_id: project_id || null,
            role: 'assistant',
            content: fullResponse,
          });

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}
