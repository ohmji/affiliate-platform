# Queue Overview

This project relies on BullMQ queues backed by Redis to coordinate background
agents. The sections below outline each queue, the code paths that enqueue jobs,
and the processors or workers that consume them.

## Queue Summary

| Queue name (default) | Env override | Producers | Consumers | Notes |
| --- | --- | --- | --- | --- |
| `product.added` | `Q_PRODUCT_INGESTION` | `ProductsService.createProduct` | `ProductIngestionProcessor`, standalone `workers/product-ingestion` | Normalises new products and seeds initial offers. |
| `price.refresh` | `Q_PRICE_REFRESH` | _Not wired yet_ | _Pending worker_ | Reserved for scheduled price refresh jobs. |
| `link.clicked` | `Q_LINK_CLICKED` | `RedirectService.resolveRedirect` | _Pending worker_ | Queues click-attribution follow-up work. |
| `campaign.publish` | _(no override yet)_ | `CampaignsService.publishCampaign` | _Pending worker_ | Intended to trigger ISR/static publish workflows. |

`apps/api/src/queues/queues.module.ts` registers the queues with BullMQ using
names from `apps/api/src/queues/queues.constants.ts`, while Redis connection
settings come from `apps/api/src/config/configuration.ts`.

## Queue Details

### product.added

- **Producer**: `apps/api/src/modules/products/products.service.ts:46` calls
  `QueuesService.enqueueProductAdded` whenever `/api/products` accepts a new
  product submission.
- **Payload**: `{ productId: string; input: { url?: string; sku?: string; marketplace?: string } }`
  as defined in `apps/api/src/queues/queues.service.ts:11`.
- **Queue options**: Jobs are enqueued under the name `ingest` with idempotent
  `jobId = productId`, up to five attempts and exponential backoff
  (`apps/api/src/queues/queues.service.ts:44`).
- **Consumers**:
  - NestJS processor `apps/api/src/queues/processors/product-ingestion.processor.ts`
    resolves marketplace data, persists offers, and emits `offers.refreshed` events.
  - The standalone worker `workers/product-ingestion/src/index.ts` provides an
    alternative BullMQ worker for non-Nest deployments; concurrency is governed
    by `PRODUCT_INGESTION_CONCURRENCY` (`workers/product-ingestion/src/index.ts:303`).

### price.refresh

- **Producer**: Reserved for the Price Refresh agent; enqueue helper lives at
  `apps/api/src/queues/queues.service.ts:55` but no caller is wired yet.
- **Payload**: `{ productId: string }`.
- **Queue options**: Jobs are added with id `productId` and no retry/backoff
  configuration yet (`apps/api/src/queues/queues.service.ts:55`).
- **Consumer**: Implementation pending. The queue is registered in
  `apps/api/src/queues/queues.module.ts:34` so a worker can be added without
  further configuration.

### link.clicked

- **Producer**: `apps/api/src/modules/redirect/redirect.service.ts:45` enqueues
  a job after persisting a `Click` record when users hit `/go/:code`.
- **Payload**: `{ linkId: string; clickId: number; metadata: { ipHash: string | null; userAgent: string | null; referrer: string | null } }`
  (`apps/api/src/queues/queues.service.ts:22`).
- **Queue options**: Jobs use the name `click`, allow three attempts, and are
  removed on completion (`apps/api/src/queues/queues.service.ts:59`).
- **Consumer**: Not implemented yet. Future analytics/guard workers should
  subscribe here to drive rollups and fraud detection.

### campaign.publish

- **Producer**: `apps/api/src/modules/campaigns/campaigns.service.ts:125`
  enqueues after emitting `campaign.published.v1` when a campaign enters the
  `published` status.
- **Payload**: `{ campaignId: string }` (`apps/api/src/queues/queues.service.ts:31`).
- **Queue options**: Jobs use the name `publish`, deduplicated by `campaignId`,
  and are removed once completed (`apps/api/src/queues/queues.service.ts:66`).
- **Consumer**: Pending. The queue is ready for a worker that calls the Next.js
  revalidation APIs to regenerate landing pages.

## Operational Notes

- Redis credentials/host are sourced from `REDIS_*` variables
  (`apps/api/src/config/configuration.ts:22`), shared across all queues.
- Queue names default to the constants above but can be overridden via
  `.env` entries (`.env.example:9`).
- When adding new processors, import `QueuesModule` so BullMQ registers the
  queue and inject the named queue via `@InjectQueue(QUEUES.X)`.
