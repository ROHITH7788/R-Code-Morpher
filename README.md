# Rohith CodeMorpher

Modern web app to convert code between programming languages with AI. Includes authentication, IDE-style UI, sharing, and dashboard.

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Auth: NextAuth (Credentials + optional Google/GitHub)
- DB: PostgreSQL via Prisma ORM
- AI: OpenAI Chat Completions (optional) with fallback

## Setup

1. Install Node.js 18+
2. Create `.env` from `.env.example` and fill values
3. Install deps: `npm install`
4. Initialize Prisma: `npx prisma generate` then `npx prisma migrate dev --name init`
5. Run dev server: `npm run dev` (http://localhost:3000)

## Notes

- Without `OPENAI_API_KEY`, conversions return a placeholder and explanation.
- OAuth requires provider credentials. Remove or add envs as needed.
- Email reset requires SMTP envs; otherwise token is created but email is not sent.

## Key Files

- Auth config: `src/lib/auth.ts`
- LLM integration: `src/lib/llm.ts`
- Convert API: `src/app/api/convert/route.ts`
- Signup API: `src/app/api/auth/signup/route.ts`
- Reset APIs: `src/app/api/auth/request-reset/route.ts`, `src/app/api/auth/reset/route.ts`
- Share API + page: `src/app/api/share/route.ts`, `src/app/share/[id]/page.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
- IDE UI: `src/app/page.tsx`
- Deployment
  - Vercel: Add project, set envs from `.env`, deploy. `vercel.json` is provided.
  - Docker: Build and run locally or on any host.
    - Build: `docker build -t codemorpher .`
    - Run: `docker run -p 3001:3000 --env-file .env codemorpher`
    - Compose: `docker compose up --build` (uses `docker-compose.yml`)
  - Prisma client generates on postinstall; for production migrations use `npm run prisma:migrate:deploy`.
