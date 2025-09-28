import OpenAI from 'openai'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type Msg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  try {
    const { messages, model, persona, sessionId, chatId: incomingChatId } = (await req.json()) as { messages: Msg[]; model?: string; persona?: string; sessionId?: string; chatId?: string }
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    if (!client.apiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500 })
    }

    const inputMsgs: any[] = []
    if (persona && String(persona).trim().length > 0) {
      inputMsgs.push({ role: 'system', content: `You are ${String(persona).trim()}. Stay in character but be helpful and concise.` })
    }
    inputMsgs.push(...messages.map(m => ({ role: m.role, content: m.content })))

    const resp = await client.responses.create({
      model: model || 'gpt-4o-mini',
      input: inputMsgs,
    })

    const text = (resp as any).output_text ?? ''
    const usage = (resp as any).usage ?? null

    // store conversation row(s)
    const supabase = getSupabaseServer()
    let chatId: string | null = null
    if (supabase) {
      // prefer explicit chatId
      if (incomingChatId) {
        chatId = incomingChatId
      } else {
        // create a new chat for this session
        const created = await supabase
          .from('chats')
          .insert({
            session_id: sessionId || null,
            title: (messages[messages.length - 1]?.content || 'New chat').slice(0, 60),
            persona: persona || null,
            model: model || null,
          })
          .select('id')
          .single()
        if (!created.error) chatId = created.data.id
      }
      const now = new Date().toISOString()
      const metaIn = { model: model || 'gpt-4o-mini', persona: persona || null, usage }
      const inRows = messages.slice(-1).map(m => ({
        session_id: sessionId || null,
        chat_id: chatId,
        role: m.role,
        content: m.content,
        created_at: now,
        meta: metaIn,
      }))
      const outRow = [{ session_id: sessionId || null, chat_id: chatId, role: 'assistant', content: text, created_at: now, meta: metaIn }]
      try { await supabase.from('messages').insert([...inRows, ...outRow]) } catch {}
    }

    return Response.json({ text, usage, chatId })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 })
  }
}


