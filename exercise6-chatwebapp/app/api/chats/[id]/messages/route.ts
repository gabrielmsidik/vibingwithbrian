import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const chatId = id
  const sb = getSupabaseServer()
  if (!sb) return new Response(JSON.stringify({ error: 'supabase not configured' }), { status: 500 })
  const { data, error } = await sb.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
  if (error) return new Response(JSON.stringify({ error: error.message, code: (error as any).code, details: (error as any).details }), { status: 500 })
  return Response.json({ messages: data })
}


