# warriorAI

NestJS backend for authenticated warriorAI APIs backed by PostgreSQL, Redis, BullMQ, and a reusable AI layer.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run start:dev
```

## Docker

```bash
docker compose up --build
```

The compose service reads runtime config from `.env`, publishes the API on `127.0.0.1:3001`, and sets `HOST=0.0.0.0` inside the container so the mapped port is reachable from the host machine.

Required env:

```bash
AI_PROVIDER=vercel
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
AI_MODEL=openai/gpt-4o-mini
DATABASE_URL=postgresql://warriorai:warriorai@localhost:5432/warriorai?schema=public
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_TTL_SECONDS=604800
REDIS_URL=redis://localhost:6379
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_URL=https://your-public-r2-domain.example.com
```

`CORS_ORIGIN` accepts comma-separated origins or full URLs. Full URLs are normalized to their origin, so `https://mail.google.com/mail/u/0/#chat/...` becomes `https://mail.google.com`.

Provider config:

- Vercel AI Gateway: leave `AI_BASE_URL` empty and set `AI_MODEL` to a gateway model id, for example `openai/gpt-4o-mini` or `anthropic/claude-sonnet-4-5`.
- Gateway shorthand: set `AI_PROVIDER=anthropic` and `AI_MODEL=claude-sonnet-4-5`; the app sends `anthropic/claude-sonnet-4-5` to the AI SDK.
- OpenAI-compatible gateway: set any `AI_PROVIDER` name, plus `AI_API_KEY`, `AI_BASE_URL`, and the raw `AI_MODEL` served by that endpoint.

## API

Auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

`/auth/register` and `/auth/login` return an access token:

```json
{
  "accessToken": "jwt_token",
  "expiresAt": "2026-08-25T00:00:00.000Z",
  "user": {
    "id": "uuid",
    "user_name": "user_name",
    "name": "User"
  }
}
```

All non-public endpoints require:

```http
Authorization: Bearer jwt_token
```

`POST /ai/chat`

Generic AI chat endpoint. Returns `text/event-stream`.

```json
{
  "prompt": "Write a short launch announcement for warriorAI.",
  "systemPrompt": "You are a concise product copywriter."
}
```

`POST /refine`

Message refinement endpoint built on top of the shared AI layer. Returns `text/event-stream`.

```json
{
  "action": "grammar",
  "message": "I has a question",
  "targetLanguage": "Vietnamese"
}
```

Events:

- `delta`: streamed text chunk
- `done`: final signal
- `error`: failure message

## Structure

- `src/ai`: reusable AI API, LLM provider integration, and prompt templates
- `src/refine`: refine-specific API and request orchestration
- `src/auth`: authentication, sessions, and global API guard
