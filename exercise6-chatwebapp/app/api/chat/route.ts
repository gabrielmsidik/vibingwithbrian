import OpenAI from 'openai'

export const runtime = 'nodejs'

type Msg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  try {
    const { messages, model } = (await req.json()) as { messages: Msg[]; model?: string }
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    if (!client.apiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500 })
    }

    const resp = await client.responses.create({
      model: model || 'gpt-4o-mini',
      input: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const text = (resp as any).output_text ?? ''
    const usage = (resp as any).usage ?? null
    return Response.json({ text, usage })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 })
  }
}


