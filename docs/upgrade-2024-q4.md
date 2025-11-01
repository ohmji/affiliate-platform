# Q4 2024 Upgrade Checklist

## Overview
- Next.js 14.2 adoption for `/apps/web`.
- NestJS 10 baseline for `/apps/api`.
- Postgres 16 and Redis 7.2 infra upgrades.

## Environments
| Env | Target Window | Owner | Notes |
| --- | --- | --- | --- |
| Local | Completed | Platform | Ensure `pnpm install` pulls upgraded dependencies. |
| Staging | TBD | Platform | Run DB migrations + smoke tests. |
| Production | TBD | Platform | Follow blue/green deploy playbook. |

## API (NestJS)
- [ ] Update `@nestjs/*` packages to ^10.
- [ ] Switch to SWC build (`nest build --watch`).
- [ ] Regenerate OpenAPI schema after refactors.

## Web (Next.js)
- [ ] Run `pnpm dlx @next/codemod` for App Router migration.
- [ ] Validate ISR pipelines post-upgrade.

## Database (Postgres)
- [ ] Prepare `pg_upgrade` instructions.
- [ ] Refresh extensions after cutover.
- [ ] Validate prisma/typeorm compatibility.

## Redis
- [ ] Enable ACLv2 + TLS in non-local envs.
- [ ] Update BullMQ + ioredis clients.
- [ ] Confirm eviction policy matches new memory model.

## Rollback Plan
- Capture DB snapshot before upgrades.
- Keep previous container images available.

