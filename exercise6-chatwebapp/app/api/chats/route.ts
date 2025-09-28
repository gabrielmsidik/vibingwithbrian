import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId') || ''
    const all = url.searchParams.get('all') === '1'
    const sb = getSupabaseServer()
    if (!sb) return new Response(JSON.stringify({ error: 'supabase not configured' }), { status: 500 })
    const query = sb.from('chats').select('*')
    const { data, error } = all
      ? await query.order('created_at', { ascending: false }).limit(20)
      : await query.eq('session_id', sessionId).order('created_at', { ascending: false })
    if (error) return new Response(JSON.stringify({ error: error.message, code: (error as any).code, details: (error as any).details }), { status: 500 })
    return Response.json({ chats: data })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'unexpected error' }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { sessionId?: string; title?: string; persona?: string; model?: string }
    const { sessionId, title, persona, model } = body
    if (!sessionId) return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400 })
    const sb = getSupabaseServer()
    if (!sb) return new Response(JSON.stringify({ error: 'supabase not configured' }), { status: 500 })
    const { data, error } = await sb.from('chats').insert({ session_id: sessionId, title: title || 'New chat', persona: persona || null, model: model || null }).select('*').single()
    if (error) return new Response(JSON.stringify({ error: error.message, code: (error as any).code, details: (error as any).details }), { status: 500 })
    return Response.json({ chat: data })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'unexpected error' }), { status: 500 })
  }
}


