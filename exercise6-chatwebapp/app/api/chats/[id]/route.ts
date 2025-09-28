import { getSupabaseServer } from '@/lib/supabaseServer'

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const sb = getSupabaseServer()
    if (!sb) return new Response(JSON.stringify({ error: 'supabase not configured' }), { status: 500 })
    const { error } = await sb.from('chats').delete().eq('id', id)
    if (error) return new Response(JSON.stringify({ error: error.message, code: (error as any).code, details: (error as any).details }), { status: 500 })
    return Response.json({ ok: true })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'unexpected error' }), { status: 500 })
  }
}


