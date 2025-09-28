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

Supabase (optional)

Env

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# or for server writes (preferred)
SUPABASE_SERVICE_ROLE=service-role-key
```

SQL (simple message log)

```sql
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  title text,
  persona text,
  model text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  chat_id uuid references chats(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index on chats (session_id, created_at desc);
create index on messages (chat_id, created_at asc);
```