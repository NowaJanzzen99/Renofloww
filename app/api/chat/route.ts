import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_task',
    description: 'Voeg een nieuwe taak toe aan het actieve verbouwingsproject van de gebruiker. Gebruik dit alleen als de gebruiker expliciet vraagt om een taak aan te maken.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'De naam van de taak, helder en beknopt' },
        due_date: { type: 'string', description: 'Deadline in YYYY-MM-DD formaat (optioneel, gebruik alleen als gevraagd)' },
        room_id: { type: 'string', description: 'ID van de ruimte (optioneel)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_expense',
    description: 'Voeg een kostenpost toe aan het actieve verbouwingsproject. Gebruik dit alleen als de gebruiker expliciet vraagt om een kosten te registreren.',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string', description: 'Omschrijving van de kosten' },
        amount: { type: 'number', description: 'Bedrag in euro (alleen getal, geen €-teken)' },
        category: {
          type: 'string',
          enum: ['materiaal', 'arbeid', 'vergunning', 'transport', 'overig'],
          description: 'Categorie van de kostenpost',
        },
      },
      required: ['description', 'amount', 'category'],
    },
  },
  {
    name: 'add_reminder',
    description: 'Stel een herinnering in voor de gebruiker. Gebruik dit als de gebruiker vraagt om iets te onthouden of een reminder te zetten.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Korte titel van de herinnering' },
        remind_at: { type: 'string', description: 'Datum en tijd in ISO 8601 formaat (bijv. 2026-06-15T09:00:00)' },
        description: { type: 'string', description: 'Extra details of context (optioneel)' },
      },
      required: ['title', 'remind_at'],
    },
  },
  {
    name: 'complete_task',
    description: 'Markeer een bestaande taak als voltooid op basis van de naam. Gebruik dit als de gebruiker zegt dat een taak klaar is.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_title: { type: 'string', description: 'Naam (of deel van naam) van de taak die voltooid is' },
      },
      required: ['task_title'],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string | undefined,
): Promise<string> {
  try {
    if (toolName === 'add_task') {
      if (!projectId) return 'Geen actief project gevonden om de taak aan toe te voegen.';
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: toolInput.title as string,
          status: 'openstaand',
          due_date: (toolInput.due_date as string) || null,
          room_id: (toolInput.room_id as string) || null,
        })
        .select()
        .single();
      if (error) return `Fout bij aanmaken taak: ${error.message}`;
      return `Taak "${data.title}" succesvol aangemaakt${data.due_date ? ` met deadline ${data.due_date}` : ''}.`;
    }

    if (toolName === 'add_expense') {
      if (!projectId) return 'Geen actief project gevonden om de kosten aan toe te voegen.';
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          description: toolInput.description as string,
          amount: toolInput.amount as number,
          category: (toolInput.category as string) || 'overig',
          date: today,
        })
        .select()
        .single();
      if (error) return `Fout bij registreren kosten: ${error.message}`;
      return `Kostenpost "${data.description}" van €${Number(data.amount).toLocaleString('nl-NL')} succesvol geregistreerd.`;
    }

    if (toolName === 'add_reminder') {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          project_id: projectId || null,
          title: toolInput.title as string,
          description: (toolInput.description as string) || null,
          remind_at: toolInput.remind_at as string,
          is_done: false,
          created_by: 'ai',
        })
        .select()
        .single();
      if (error) return `Fout bij aanmaken herinnering: ${error.message}`;
      const remindDate = new Date(data.remind_at).toLocaleDateString('nl-NL', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      });
      return `Herinnering "${data.title}" ingesteld voor ${remindDate}.`;
    }

    if (toolName === 'complete_task') {
      if (!projectId) return 'Geen actief project gevonden.';
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .ilike('title', `%${toolInput.task_title as string}%`)
        .neq('status', 'voltooid')
        .limit(1);

      if (!tasks || tasks.length === 0) {
        return `Geen openstaande taak gevonden met de naam "${toolInput.task_title}".`;
      }

      const task = tasks[0];
      await supabase
        .from('tasks')
        .update({ status: 'voltooid', completed_at: new Date().toISOString() })
        .eq('id', task.id);

      return `Taak "${task.title}" gemarkeerd als voltooid! ✅`;
    }

    return `Onbekende tool: ${toolName}`;
  } catch (err) {
    return `Uitvoering mislukt: ${err instanceof Error ? err.message : 'onbekende fout'}`;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check trial/plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, trial_ends_at')
      .eq('id', user.id)
      .single();

    const isPro = profile?.is_pro ?? false;

    if (!isPro) {
      if (!profile?.trial_ends_at || new Date(profile.trial_ends_at) <= new Date()) {
        return NextResponse.json(
          { error: 'Proefperiode verlopen. Upgrade naar Pro om de AI assistent te gebruiken.' },
          { status: 403 }
        );
      }
      const { count } = await supabase
        .from('ai_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user');
      if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: 'Je hebt je 5 gratis AI chats gebruikt. Upgrade naar Pro voor onbeperkt gebruik.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { messages, project_id } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      project_id?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Geen berichten opgegeven' }, { status: 400 });
    }

    // ── Build project context ──
    let projectContext = '';
    let projectName = '';
    if (project_id) {
      try {
        const [projectRes, contractorsRes, quotesRes, expensesRes, tasksRes, roomsRes] = await Promise.all([
          supabase.from('projects').select('*').eq('id', project_id).single(),
          supabase.from('contractors').select('name, type').eq('project_id', project_id),
          supabase.from('quotes').select('amount, status, description').eq('project_id', project_id),
          supabase.from('expenses').select('amount, category, description').eq('project_id', project_id),
          supabase.from('tasks').select('id, title, status, due_date').eq('project_id', project_id).limit(15),
          supabase.from('rooms').select('id, name').eq('project_id', project_id),
        ]);

        const project = projectRes.data;
        const contractors = contractorsRes.data || [];
        const quotes = quotesRes.data || [];
        const expenses = expensesRes.data || [];
        const tasks = tasksRes.data || [];
        const rooms = roomsRes.data || [];

        if (project) {
          projectName = project.name;
          const totalExpenses = expenses.reduce((s: number, e: { amount: string | number }) => s + Number(e.amount), 0);
          const pendingQuotes = quotes.filter((q: { status: string }) => q.status === 'in_behandeling' || q.status === 'pending');
          const openTasks = tasks.filter((t: { status: string }) => t.status !== 'voltooid' && t.status !== 'done');

          projectContext = `

PROJECTCONTEXT:
- Project: ${project.name} (ID: ${project.id})
- Type: ${project.type} | Status: ${project.status}
- Budget: €${project.budget ? Number(project.budget).toLocaleString('nl-NL') : 'niet ingesteld'}
- Besteed: €${totalExpenses.toLocaleString('nl-NL')} (${project.budget ? Math.round((totalExpenses / Number(project.budget)) * 100) : 0}%)
- Startdatum: ${project.start_date || 'niet ingesteld'} | Einddatum: ${project.end_date || 'niet ingesteld'}
- Aannemers: ${contractors.length > 0 ? contractors.map((c: { name: string; type: string | null }) => `${c.name}${c.type ? ` (${c.type})` : ''}`).join(', ') : 'geen'}
- Openstaande offertes: ${pendingQuotes.length}
- Ruimtes: ${rooms.length > 0 ? rooms.map((r: { id: string; name: string }) => `${r.name} (ID: ${r.id})`).join(', ') : 'geen'}
- Openstaande taken (${openTasks.length}): ${openTasks.slice(0, 8).map((t: { id: string; title: string; status: string }) => `"${t.title}" [${t.status}]`).join(', ')}`;
        }
      } catch (err) {
        console.error('Project context fetch error:', err);
      }
    }

    const today = new Date().toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const systemPrompt = `Je bent een AI assistent voor Renofloww, een verbouwingsbeheer-app voor Nederlandse huiseigenaren. Je naam is Renofloww AI.

Vandaag is het: ${today}.

Je kunt echte acties uitvoeren in de app via tools:
- **add_task**: Maak een nieuwe taak aan
- **add_expense**: Registreer een kostenpost
- **add_reminder**: Stel een herinnering in
- **complete_task**: Markeer een taak als voltooid

Gebruik tools ALLEEN als de gebruiker expliciet vraagt om een actie uit te voeren. Voor vragen, advies of analyse antwoord je gewoon in tekst.

Na het uitvoeren van een tool bevestig je wat je hebt gedaan in begrijpelijke taal, en geef je eventueel relevante tips of vervolgstappen.

Spreek altijd Nederlands. Wees praktisch, vriendelijk en concreet. Gebruik af en toe emoji's voor warmte. Geef specifieke adviezen gebaseerd op de projectcontext.${projectContext}`;

    const lastUserMessage = messages[messages.length - 1];
    const conversationHistory = messages.slice(0, -1);

    // Save user message to DB
    await supabase.from('ai_messages').insert({
      user_id: user.id,
      project_id: project_id || null,
      role: 'user',
      content: lastUserMessage.content,
    });

    const apiMessages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user' as const, content: lastUserMessage.content },
    ];

    // ── First call: non-streaming (to handle tool use) ──
    const firstResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: apiMessages,
    });

    let finalText = '';

    if (firstResponse.stop_reason === 'tool_use') {
      // Extract tool use blocks
      const toolUseBlocks = firstResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      // Execute each tool
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      const executedActions: string[] = [];

      for (const toolBlock of toolUseBlocks) {
        const result = await executeTool(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>,
          supabase,
          user.id,
          project_id,
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
        });
        executedActions.push(result);
      }

      // Build messages with tool results for second call
      const messagesWithTools: Anthropic.MessageParam[] = [
        ...apiMessages,
        { role: 'assistant' as const, content: firstResponse.content },
        { role: 'user' as const, content: toolResults },
      ];

      // Second call: stream the final response
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: messagesWithTools,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text;
                finalText += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            await supabase.from('ai_messages').insert({
              user_id: user.id,
              project_id: project_id || null,
              role: 'assistant',
              content: finalText,
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
          'X-Tool-Executed': 'true',
        },
      });

    } else {
      // No tool use — stream the response directly from firstResponse content
      const textBlocks = firstResponse.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      const responseText = textBlocks.map((b) => b.text).join('');

      // Save to DB
      await supabase.from('ai_messages').insert({
        user_id: user.id,
        project_id: project_id || null,
        role: 'assistant',
        content: responseText,
      });

      // Stream text character by character for nice effect
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(responseText));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}
