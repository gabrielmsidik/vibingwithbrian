"use client"
import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"

type Msg = { role: 'user' | 'assistant'; content: string; meta?: { durationSec?: number; costUSD?: number; inputTokens?: number; outputTokens?: number } }

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [model, setModel] = useState<string>('gpt-5')
  const [thinking, setThinking] = useState<string>("")
  const thinkTimer = useRef<number | null>(null)
  
  const [persona, setPersona] = useState<string>("")
  const [started, setStarted] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [chats, setChats] = useState<any[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [pendingChatId, setPendingChatId] = useState<string | null>(null)

  const examples = [
    "a witty pirate captain",
    "a zen tea master",
    "a snarky stand‑up comic",
    "an enthusiastic space tour guide",
    "a noir detective",
    "a helpful grandma coder",
  ]
  function randomPersona() {
    return examples[Math.floor(Math.random() * examples.length)]
  }

  async function refreshChats() {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/chats?sessionId=${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      setChats(data.chats || [])
      if (!activeChatId && data.chats?.[0]?.id) setActiveChatId(data.chats[0].id)
    } catch {}
  }

  // Debug fetch (optional): try ?all=1 if session-bound query returns empty
  useEffect(() => {
    if (!sessionId) return
    if (chats.length === 0) {
      ;(async () => {
        try {
          const res = await fetch(`/api/chats?all=1`)
          const data = await res.json()
          if ((data.chats || []).length > 0 && !activeChatId) {
            setChats(data.chats)
          }
        } catch {}
      })()
    }
  }, [sessionId, chats.length])

  async function newChat() {
    const res = await fetch('/api/chats', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, title: 'New chat', persona, model }) })
    const data = await res.json()
    if (data.chat?.id) {
      setChats(prev => [data.chat, ...prev])
      setActiveChatId(data.chat.id)
      setPendingChatId(data.chat.id)
      setMessages([])
      setStarted(false)
    }
  }

  async function selectChat(id: string) {
    setActiveChatId(id)
    setPendingChatId(null)
    try {
      const res = await fetch(`/api/chats/${id}/messages`)
      const data = await res.json()
      const loaded: Msg[] = (data.messages || []).map((m: any): Msg => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || ''),
      }))
      setMessages(loaded)
      setStarted(true)
    } catch {}
  }

  useEffect(() => {
    try {
      let sid = undefined as string | undefined
      if (typeof window !== 'undefined') {
        sid = window.localStorage.getItem('chat.sessionId') || undefined
        if (!sid) {
          const rnd = (globalThis as any)?.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
          sid = rnd
          window.localStorage.setItem('chat.sessionId', sid as string)
        }
      }
      setSessionId(typeof sid === 'string' && sid.length > 0 ? sid : Math.random().toString(36).slice(2))
    } catch {
      setSessionId(Math.random().toString(36).slice(2))
    }
  }, [])

  useEffect(() => { refreshChats() }, [sessionId])


  async function send() {
    if (!input.trim() || sending) return
    const next: Msg[] = [...messages, { role: 'user', content: input.trim() } as Msg]
    setMessages(next)
    setInput("")
    setSending(true)
    if (!started) setStarted(true)
    startThinking()
    try {
      const t0 = performance.now()
      const chatIdToUse = pendingChatId ?? (started ? activeChatId : null)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, model, persona: persona.trim(), sessionId, chatId: chatIdToUse || undefined }),
      })
      const { text, usage, chatId } = await res.json()
      stopThinking()
      await typeAppend(text)
      // if we created a brand new chat (no chatIdToUse), add it locally and activate
      if (chatId && !chatIdToUse) {
        setActiveChatId(chatId)
        setChats(prev => [{ id: chatId, title: (next[next.length-1]?.content || 'New chat').slice(0,60), persona, model, created_at: new Date().toISOString() }, ...prev])
      }
      // clear pending once first message is sent
      if (pendingChatId) setPendingChatId(null)
      const t1 = performance.now()
      const secsNum = (t1 - t0) / 1000
      // simple price table (USD per 1K tokens) — adjust if your pricing differs
      const pricing: Record<string, { in: number; out: number }> = {
        'gpt-5': { in: 0.005, out: 0.015 },
        'gpt-4o': { in: 0.005, out: 0.015 },
        'gpt-4o-mini': { in: 0.0005, out: 0.0015 },
        'o4-mini': { in: 0.003, out: 0.006 },
      }
      const u = usage ?? { input_tokens: 0, output_tokens: 0 }
      const p = pricing[model] || pricing['gpt-4o-mini']
      const costNum = (u.input_tokens * p.in / 1000) + (u.output_tokens * p.out / 1000)
      // attach meta to the last assistant message
      setMessages(m => {
        const copy = [...m]
        const idx = copy.slice().reverse().findIndex(mm => mm.role === 'assistant')
        if (idx === -1) return copy
        const realIdx = copy.length - 1 - idx
        copy[realIdx] = {
          ...copy[realIdx],
          meta: {
            durationSec: secsNum,
            costUSD: costNum,
            inputTokens: u.input_tokens,
            outputTokens: u.output_tokens,
          }
        }
        return copy
      })
    } finally {
      setSending(false)
    }
  }

  function startThinking() {
    stopThinking()
    const dots = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
    let i = 0
    setThinking(dots[i])
    thinkTimer.current = window.setInterval(() => {
      i = (i + 1) % dots.length
      setThinking(dots[i])
    }, 100)
    // show a placeholder assistant bubble while thinking
    setMessages(m => [...m, { role: 'assistant', content: '' } as Msg])
  }

  function stopThinking() {
    if (thinkTimer.current) { clearInterval(thinkTimer.current); thinkTimer.current = null }
    setThinking("")
  }

  async function typeAppend(full: string) {
    // replace last assistant message (placeholder) by typing effect
    setMessages(m => {
      const copy = [...m]
      const idx = copy.slice().reverse().findIndex(mm => mm.role === 'assistant')
      if (idx === -1) return [...copy, { role: 'assistant', content: full } as Msg]
      const realIdx = copy.length - 1 - idx
      copy[realIdx] = { role: 'assistant', content: '' }
      return copy
    })
    let shown = ""
    for (let i = 0; i < full.length; i++) {
      shown += full[i]
      // chunk update for perf
      if (i % 2 === 0 || i === full.length - 1) {
        const cur = shown
        setMessages(m => {
          const copy = [...m]
          const idx = copy.slice().reverse().findIndex(mm => mm.role === 'assistant')
          if (idx === -1) return [...copy, { role: 'assistant', content: cur } as Msg]
          const realIdx = copy.length - 1 - idx
          copy[realIdx] = { role: 'assistant', content: cur }
          return copy
        })
        await new Promise(r => setTimeout(r, 8))
      }
    }
  }

  return (
    <main className="relative z-10 mx-auto max-w-2xl p-4 min-h-screen grid place-items-center">
      <Card className="w-full bg-background/60 backdrop-blur-md border border-border/60 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="tracking-tight">Chat</CardTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <label htmlFor="model">Model</label>
              <select id="model" value={model} onChange={e => setModel(e.target.value)} className="bg-background/60 border border-border/60 rounded-md px-2 py-1">
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="o4-mini">o4-mini</option>
                <option value="gpt-5">gpt-5</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            <Button variant="outline" onClick={newChat}>+ New</Button>
            {chats.map(c => (
              <div key={c.id} className="flex items-center gap-1">
                <Button variant={activeChatId === c.id ? 'default' : 'ghost'} onClick={() => selectChat(c.id)} className="truncate max-w-[160px]">
                  {c.title || 'Chat'}
                </Button>
                <Button variant="ghost" onClick={async () => {
                  try {
                    await fetch(`/api/chats/${c.id}`, { method: 'DELETE' })
                    setChats(prev => prev.filter(x => x.id !== c.id))
                    if (activeChatId === c.id) {
                      setActiveChatId(null)
                      setMessages([])
                      setStarted(false)
                    }
                  } catch {}
                }}>✕</Button>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Input
                value={persona}
                onChange={e => setPersona(e.target.value)}
                placeholder={`persona (e.g. "${examples[0]}")`}
              />
              <Button variant="outline" onClick={() => setPersona(randomPersona())}>Random</Button>
              <Button variant="ghost" onClick={() => setPersona("")}>Clear</Button>
            </div>
            {!started && (
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e as any).nativeEvent?.isComposing) return
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (input.trim() && !sending) send()
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="h-14 text-base rounded-2xl"
                />
                <Button onClick={send} disabled={sending || !input.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {started && (
          <ScrollArea className="h-[60vh] rounded-lg border border-border/60 p-4 bg-background/40 backdrop-blur-sm">
            <div className="grid gap-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'inline-block max-w-[85%] rounded-xl bg-primary/90 text-primary-foreground px-3 py-2 shadow'
                        : 'inline-block max-w-[85%] rounded-xl bg-accent/85 text-accent-foreground px-3 py-2 border border-border/50 shadow'
                    }
                  >
                    {m.content || (m.role === 'assistant' && thinking ? <span className="inline-flex items-center gap-2"><span>Thinking</span><span>{thinking}</span></span> : null)}
                    {m.role === 'assistant' && m.meta && (
                      <div className="mt-1 text-[11px] text-muted-foreground/80">
                        {[
                          typeof m.meta.durationSec === 'number' ? `${m.meta.durationSec.toFixed(2)}s` : null,
                          typeof m.meta.costUSD === 'number' ? `$${m.meta.costUSD.toFixed(5)}` : null,
                          typeof m.meta.inputTokens === 'number' && typeof m.meta.outputTokens === 'number' ? `${m.meta.inputTokens}▼/${m.meta.outputTokens}▲` : null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          )}
          {started && (
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e as any).nativeEvent?.isComposing) return
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (input.trim() && !sending) send()
                  return
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !sending) send()
                }
              }}
              rows={3}
              placeholder="Ask me anything..."
              className="resize-none bg-background/70"
            />
            <Button onClick={send} disabled={sending || !input.trim()} className="self-end" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          )}
          {started && (<div className="text-xs text-muted-foreground/80 select-none">Enter to send • Shift+Enter for newline • Cmd/Ctrl+Enter to send</div>)}
        </CardContent>
      </Card>
    </main>
  )
}
