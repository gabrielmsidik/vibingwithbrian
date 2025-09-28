Minimal Bun + Next.js chat app using OpenAI Responses API, shadcn/ui, and a LiquidEther background.

Quickstart

1) Env

```bash
echo "OPENAI_API_KEY=YOUR_KEY" > .env.local
```

2) Run

```bash
bun install
bun dev
```

API

- POST `/api/chat` with body `{ messages: { role: 'user'|'assistant', content: string }[] }`
- Model: `gpt-4o-mini` (change in `app/api/chat/route.ts`)
