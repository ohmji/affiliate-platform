# Affiliate Platform

Affiliate marketing suite that ingests marketplace products, normalises offers, generates affiliate links, publishes promotional landing pages, and rolls up analytics. The system is built from focused agents coordinated through Redis-backed queues and an event bus.

## Architecture Overview
- **Frontend** (`apps/web`): Next.js 14 App Router experience with ISR-backed campaign pages and an admin UI.
- **API** (`apps/api`): NestJS 10 service exposing REST endpoints, queuing background work, and emitting domain events.
- **Workers** (`workers/*`): BullMQ-driven agents handling product ingestion, mock click replay, and additional async jobs.
- **Packages** (`packages/*`): Shared adapters, event contracts, and event bus clients.
- **Infra**: PostgreSQL 16 for persistence, Redis 7.2 for queues/streams, optional S3 for assets (future). Local development uses Docker Compose (`docker-compose.yml`).

See `AGENTS.md` for the detailed agent roster, event model, and upgrade roadmap.

## Repository Layout
- `apps/api`: NestJS service, database entities, migrations, queues, and scripts.
- `apps/web`: Next.js frontend for public and admin surfaces.
- `packages/adapters`: Marketplace adapters plus deterministic mock fixtures.
- `packages/event-contracts`: Type-safe event contracts consumed by API and workers.
- `packages/event-bus`: Redis Streams/BullMQ event bus implementation.
- `workers/product-ingestion`: Agent resolving product metadata and offers.
- `workers/mock-click-emitter`: Background job that replays fixture clicks for dashboards.
- `docs/`: Deployment and ops notes (e.g., `docs/deploy/vercel-render-supabase.md`).

## Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`corepack enable`)
- Docker + Docker Compose for Postgres/Redis
- (Optional) RedisInsight or psql for inspecting data stores

## Getting Started
1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env
   # adjust secrets, CORS origins, and allowlists as needed
   ```
3. **Start infrastructure**
   ```bash
   docker compose up -d postgres redis
   ```
4. **Run services**
   ```bash
   pnpm --filter @apps/api dev          # NestJS API
   pnpm --filter @apps/web dev          # Next.js web app
   pnpm --filter @workers/product-ingestion dev  # product ingestion agent
   pnpm --filter @workers/mock-click-emitter dev # mock analytics generator
   ```
5. **Seed mock data (recommended for local/CI)**
   ```bash
   pnpm mock:seed
   ```

Visit `http://localhost:3000/api` for API routes and Swagger docs (`/api/docs`), and `http://localhost:3000` for the web UI.

## Testing & Quality
- **Unit tests**: `pnpm --filter @apps/api test`
- **Linting**: `pnpm lint`
- **Formatting**: `pnpm format`
- **Type checks (web)**: `pnpm --filter @apps/web typecheck`

CI runs linting, tests, and build steps before deploying API and web workloads.

## Mock Data & Fixtures
- Toggle mock mode with `USE_MOCK_DATA=true` (default in `.env.example`).
- Fixtures live under `packages/adapters/mocks/fixtures/v1/*` and fuel both adapters and seed scripts.
- `GET /api/mock/fixtures` (dev-only) exposes sample payloads for frontend development.
- `workers/mock-click-emitter` replays fixture click streams to keep analytics dashboards populated.

## Background Jobs & Events
- Queues are defined in `apps/api/src/queues` and keyed via `QUEUES.*`.
- Redis Streams topics mirror event names (`product.added`, `offers.refreshed`, `campaign.published`, etc.).
- Agents are idempotent, log structured events, and rely on retries with exponential backoff.
- Refer to `AGENTS.md` for sequence diagrams of ingestion, redirect tracking, and analytics rollups.

## Deployment Notes
- Render/Next.js/Vercel setup guidance lives in `docs/deploy/vercel-render-supabase.md` and `render.yaml`.
- Production should disable mock mode, enable Redis TLS/ACLs, rotate secrets, and ensure Postgres migrations run (`pnpm --filter @apps/api run migration:run`).
- After deployments, revalidate campaign pages via the Campaign Publisher agent or Next.js revalidate APIs.

## Troubleshooting
- **API can’t connect to Postgres/Redis**: ensure Docker containers are running and env variables match `.env`.
- **Queues not processing**: confirm workers are running and `USE_MOCK_DATA` is set appropriately.
- **Events missing**: inspect Redis Streams with `xrange` or BullMQ dashboards; verify event bus credentials.
- **Frontend 500s on mock data**: run `pnpm mock:seed` to sync fixtures with database state.

For deeper architectural context or future upgrade plans, start with `AGENTS.md` and the Q4 2024 upgrade checklist (`docs/upgrade-2024-q4.md`, create/detail as needed).
