# Deploying with Vercel, Render, and Supabase

This guide wires the monorepo into a production setup where:

- **Next.js web app** (`apps/web`) is deployed on **Vercel**.
- **NestJS API** (`apps/api`) is deployed on **Render**.
- **Postgres** is provided by **Supabase** (managed Postgres 16 with SSL).
- **Redis** can run on Render (or another TLS-enabled provider such as Upstash) for queues and the event bus.

The repository now includes `render.yaml`, so Render can provision the API service straight from the blueprint.

---

## 1. Prerequisites

- GitHub/GitLab repository with this codebase.
- `pnpm` 8+ (via `corepack enable pnpm`).
- Accounts for Vercel, Render, Supabase (and a Redis provider).
- Supabase connection string with `?sslmode=require`.

Keep the following secrets handy:

| Secret | Used by | Notes |
| --- | --- | --- |
| `SUPABASE_DATABASE_URL` | Render (as `DATABASE_URL`) | Use the pooled connection string (`postgresql://...:6543/...?...sslmode=require`). |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_TLS` | Render | Render Redis or Upstash. Set `REDIS_TLS=true` if TLS is required (Upstash, Render Redis). |
| `IP_HASH_SECRET` | Render | Random 32+ character secret for hashing IP addresses. |
| `CORS_ORIGINS` | Render | Comma-separated list of allowed origins (e.g. `https://affiliate-web.vercel.app`). |
| `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL` | Vercel | Point to the Render API URL (e.g. `https://affiliate-api.onrender.com/api`). |

---

## 2. Provision Supabase (Postgres)

1. Create a Supabase project (Region close to your users).  
2. In **Project Settings → Database**, copy the **Connection Pooling** string (port `6543`) and append `?sslmode=require` if it is missing.
3. (Optional but recommended) Run the TypeORM migrations once to confirm connectivity:
   ```bash
   export DATABASE_URL="postgresql://...supabase...:6543/postgres?sslmode=require"
   pnpm install
   pnpm --filter @apps/api migration:run
   ```
   The same command runs automatically in Render via `render.yaml` on every deploy.

---

## 3. Deploy the API to Render

1. Commit `render.yaml` and push it to the default branch.
2. In the Render dashboard, click **Blueprints → New Blueprint** and point it at your repository. Render will detect `render.yaml`.
3. Review the generated service:
   - **Name**: `affiliate-api` (can be changed).
   - **Plan**: `free` (upgrade later for more resources).
   - **Region**: keep close to Supabase.
   - **Build Command**: installs dependencies (`pnpm install --frozen-lockfile --prod=false`), builds the shared event-bus packages (`pnpm --filter @event-bus/contracts build` and `pnpm --filter @event-bus/redis-event-bus build`), then compiles the API (`pnpm --filter @apps/api build`).
   - **Start Command**: runs migrations first, then boots the NestJS app (free-tier limitation that disallows a dedicated pre-deploy step).
4. Provide environment variables (Render will prompt for the ones marked `sync: false`):

   | Key | Example / Description |
   | --- | --- |
   | `DATABASE_URL` | Supabase connection string with `sslmode=require`. |
   | `CORS_ORIGINS` | `https://affiliate-web.vercel.app` (add any admin hostnames, comma separated). |
   | `REDIS_HOST` | From Render Redis or chosen provider. |
   | `REDIS_PORT` | e.g. `6379`. |
   | `REDIS_USERNAME` | Optional (Upstash/Render). |
   | `REDIS_PASSWORD` | Redis password/secret. |
   | `REDIS_TLS` | `true` if TLS required, otherwise `false`. |
   | `IP_HASH_SECRET` | Random secret (32+ chars). |
   | `EVENT_STREAM_PREFIX` | Keep default `affiliate` or customize for multi-env. |
   | `EVENT_NAMESPACE` | e.g. `production`. |
   | `REDIRECT_ALLOWLIST` | `lazada.co.th,shopee.co.th` (extend if new marketplaces are added). |

   Render automatically injects `PORT=10000` per the blueprint. The app binds to `0.0.0.0`, so no extra change is required.
7. If you prefer to run migrations manually (e.g., to avoid every restart running them), remove the migration line from the start command and trigger `pnpm --filter @apps/api migration:run` locally or via a one-off Render Job/CLI when schema changes ship.
5. Add a Redis instance (Render → New → Redis) or connect an external provider, then update the env vars above.
6. Trigger the first deploy. Verify:
   - `/api/health` returns `{ status: "ok" }`.
   - `/api/docs` serves Swagger (if enabled by config).

For background queues or cron workers, add additional **Render Worker** services that run dedicated processors once those scripts exist (e.g., `node apps/api/dist/workers/price-refresh.js`).

---

## 4. Deploy the web app to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Use the following build settings:
   - **Install Command**: `pnpm install --frozen-lockfile`
   - **Build Command**: `pnpm --filter @apps/web build`
   - **Output Directory**: `.next`
   - **Framework**: Next.js (auto-detected).
4. Define environment variables per environment (Production / Preview / Development):

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_BASE_URL` | `https://affiliate-api.onrender.com/api` (replace with your Render URL). |
   | `API_BASE_URL` | Same as above (used by server components/server actions). |
   | `NEXT_PUBLIC_SITE_URL` (if introduced later) | e.g. `https://affiliate-web.vercel.app`. |

   For preview deployments, point these URLs to a staging Render service if you create one.
5. Trigger a deploy. Confirm ISR/landing pages load and API calls succeed (check browser dev tools for CORS errors; adjust `CORS_ORIGINS` on Render if needed).

---

## 5. CI/CD flow

- **Render** redeploys the API on every push to `main` (or the branch you configure) plus on manual triggers. Migrations execute automatically through `deployCommand`.
- **Vercel** builds preview deployments for pull requests and promotes to production on merge.
- Add required status checks (Render deploy + Vercel production) to the GitHub repo to enforce successful builds before merging.

---

## 6. Operations checklist

- Rotate secrets (`DATABASE_URL`, Redis credentials, `IP_HASH_SECRET`) via platform dashboards; redeploy to refresh.
- Monitor Render logs for BullMQ queues; add alerts through Render → Alerts or integrate with Logtail/Datadog.
- Use Supabase SQL editor or pgAdmin to inspect data. Supabase backups run automatically; schedule retention according to compliance needs.
- Document any additional environment variables in `.env.example` so local and CI environments stay aligned.

You now have end-to-end deployment targets with managed CI/CD for both the frontend and backend tiers. Update this guide as you add new services (e.g., worker dynos, analytics exporters, or additional Redis consumers).
