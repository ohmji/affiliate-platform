# Affiliate Platform Web

Next.js 14 frontend for the affiliate promotion control center. The UI mirrors the agent-oriented design in `AGENTS.md` by surfacing product ingestion, campaign publishing, affiliate link generation, and analytics rollups.

## Getting Started

```bash
# ensure dependencies
pnpm install

# run API + workers (separate terminal)
pnpm --filter @apps/api start:dev

# run the web app
pnpm --filter @apps/web dev
```

Set the API endpoint in `.env.local` (defaults to `http://localhost:3000/api`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
API_BASE_URL=http://localhost:3000/api
```

## Pages

- `/` – Overview dashboard pulling aggregated metrics from `GET /api/dashboard`.
- `/campaigns` – Public campaign feed rendered via ISR-friendly server components.
- `/admin/products` – Product ingestion workflow; posts to `POST /api/products` and fetches offers.
- `/admin/campaigns` – Upsert campaigns and trigger the publisher agent.
- `/admin/links` – Generate affiliate redirects against the secured allowlist.
- `/admin/analytics` – React Query powered snapshot of click rollups.

The UI uses Material UI + Emotion with SSR support, React Query for data fetching, and Axios utilities in `lib/api-client.ts`.
