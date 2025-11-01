import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import {
  mockAdapter,
  pickAdapter,
  type ResolveProductInput,
  type ResolvedProduct
} from '@adapters/core';
import { OffersRefreshedEvent } from '@event-bus/contracts/events';
import { RedisEventBus } from '@event-bus/redis-event-bus';
import type { Processor, Job } from 'bullmq';
import { Worker as BullWorker } from 'bullmq';
import pino from 'pino';
import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { ulid } from 'ulid';

type ProductAddedJobData = {
  productId: string;
  input: ResolveProductInput;
};

type PersistedOffer = {
  marketplace: string;
  storeName: string;
  price: number;
  currency: string;
  lastCheckedAt: Date;
};

const logger = pino({
  name: 'ProductIngestionWorker',
  level: process.env.LOG_LEVEL ?? 'info'
});

const queueName = process.env.Q_PRODUCT_INGESTION ?? 'product.added';
const redisTlsEnabled = process.env.REDIS_TLS === 'true';
const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  username: process.env.REDIS_USERNAME ?? undefined,
  password: process.env.REDIS_PASSWORD ?? undefined,
  tls: redisTlsEnabled ? {} : undefined
};

const pool = new Pool(resolvePoolConfig());
const eventBus = new RedisEventBus({
  streamPrefix: process.env.EVENT_STREAM_PREFIX ?? 'affiliate',
  namespace: process.env.EVENT_NAMESPACE ?? 'default',
  redis: redisConnection
});

const useMockData = process.env.USE_MOCK_DATA === 'true';
const schemaName = process.env.DB_SCHEMA ?? 'public';
let worker: BullWorker<ProductAddedJobData> | null = null;
let shuttingDown = false;

function resolvePoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.length > 0) {
    return { connectionString: databaseUrl };
  }

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'affiliate',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres'
  };
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : NaN;
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function sanitizeSchema(schema: string): string | null {
  if (!schema || schema === 'public') {
    return null;
  }

  const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!identifierPattern.test(schema)) {
    logger.warn({ schema }, 'Ignoring invalid DB schema configuration');
    return null;
  }

  return `"${schema}"`;
}

const schemaSearchPath = sanitizeSchema(schemaName);

function selectAdapter(input: ResolveProductInput) {
  if (useMockData) {
    return mockAdapter;
  }

  try {
    return pickAdapter(input);
  } catch (error) {
    logger.warn(
      { err: error, input },
      'Falling back to mock adapter after registry lookup failure'
    );
    return mockAdapter;
  }
}

async function applySearchPath(client: PoolClient) {
  if (!schemaSearchPath) {
    return;
  }

  await client.query(`SET search_path TO ${schemaSearchPath}`);
}

async function persistProduct(
  productId: string,
  resolved: ResolvedProduct,
  input: ResolveProductInput
): Promise<PersistedOffer[]> {
  const client = await pool.connect();

  try {
    await applySearchPath(client);
    await client.query('BEGIN');

    const normalizedSku = input.sku?.toLowerCase() ?? null;
    const normalizedUrl = input.url?.trim() ?? null;

    await client.query(
      `
        INSERT INTO products (
          id,
          title,
          image_url,
          source,
          normalized_sku,
          normalized_url,
          raw_input,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
        ON CONFLICT (id) DO UPDATE
        SET
          title = EXCLUDED.title,
          image_url = EXCLUDED.image_url,
          normalized_sku = COALESCE(products.normalized_sku, EXCLUDED.normalized_sku),
          normalized_url = COALESCE(products.normalized_url, EXCLUDED.normalized_url),
          raw_input = COALESCE(products.raw_input, EXCLUDED.raw_input),
          updated_at = now()
      `,
      [
        productId,
        resolved.product.title ?? null,
        resolved.product.imageUrl ?? null,
        'admin',
        normalizedSku,
        normalizedUrl,
        input && Object.keys(input).length > 0 ? input : null
      ]
    );

    await client.query('DELETE FROM offers WHERE product_id = $1', [productId]);

    const now = new Date();
    const offers: PersistedOffer[] = resolved.offers.map((offer) => ({
      marketplace: offer.marketplace,
      storeName: offer.storeName,
      price: Number(offer.price),
      currency: offer.currency ?? 'THB',
      lastCheckedAt: now
    }));

    await Promise.all(
      offers.map((offer) =>
        client.query(
          `
            INSERT INTO offers (
              id,
              product_id,
              marketplace,
              store_name,
              price,
              currency,
              last_checked_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            randomUUID(),
            productId,
            offer.marketplace,
            offer.storeName,
            offer.price,
            offer.currency,
            offer.lastCheckedAt.toISOString()
          ]
        )
      )
    );

    await client.query('COMMIT');

    return offers;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function pickBestOffer(
  offers: Array<{ price: number; marketplace: string }>
): { marketplace: string; price: number } | null {
  if (!offers.length) {
    return null;
  }

  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const best = sorted[0];
  return {
    marketplace: best.marketplace,
    price: best.price
  };
}

const processor: Processor<ProductAddedJobData> = async (
  job: Job<ProductAddedJobData>
) => {
  const { productId, input } = job.data ?? {};

  if (!productId) {
    throw new Error('Missing productId in job payload');
  }

  const adapter = selectAdapter(input ?? {});
  logger.info(
    { jobId: job.id, productId, adapter: adapter.name },
    'Resolving product via adapter'
  );

  const resolved = await adapter.resolveProduct(input ?? {});

  if (!resolved || !resolved.product) {
    throw new Error(`Adapter ${adapter.name} returned empty product`);
  }

  const offers = await persistProduct(productId, resolved, input ?? {});

  logger.info(
    { productId, offerCount: offers.length },
    'Persisted offers for product'
  );

  const offersForEvent: OffersRefreshedEvent['data']['offers'] = offers.map(
    (offer) => ({
      marketplace: offer.marketplace,
      storeName: offer.storeName,
      price: offer.price,
      currency: offer.currency,
      lastCheckedAt: offer.lastCheckedAt.toISOString()
    })
  );

  const best = pickBestOffer(offersForEvent);

  const event: OffersRefreshedEvent = {
    id: ulid(),
    ts: new Date().toISOString(),
    type: 'offers.refreshed.v1',
    version: 1,
    data: {
      productId,
      offers: offersForEvent,
      best
    }
  };

  await eventBus.publish(event);

  logger.info(
    { productId, offerCount: offersForEvent.length },
    'Published offers.refreshed event'
  );

  return { offerCount: offersForEvent.length };
};

async function bootstrap() {
  logger.info({ queueName }, 'Bootstrapping product ingestion worker');

  await pool.query('SELECT 1');

  worker = new BullWorker<ProductAddedJobData>(queueName, processor, {
    connection: redisConnection,
    concurrency: parsePositiveInt(process.env.PRODUCT_INGESTION_CONCURRENCY, 2)
  });

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id, productId: job.data.productId },
      'Product ingestion completed'
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, productId: job?.data?.productId, err: error },
      'Product ingestion failed'
    );
  });

  await worker.waitUntilReady();

  logger.info({ queueName }, 'Product ingestion worker ready');
}

async function shutdown(exitCode: number) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info({ exitCode }, 'Shutting down product ingestion worker');

  if (worker) {
    await worker.close();
  }

  try {
    await eventBus.close();
  } catch (error) {
    logger.warn({ err: error }, 'Failed to close event bus cleanly');
  }

  try {
    await pool.end();
  } catch (error) {
    logger.warn({ err: error }, 'Failed to close Postgres pool cleanly');
  }

  process.exit(exitCode);
}

const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) => {
  process.on(signal, () => {
    logger.info({ signal }, 'Received shutdown signal');
    void shutdown(0);
  });
});

process.on('unhandledRejection', (error) => {
  logger.error({ err: error }, 'Unhandled promise rejection');
  void shutdown(1);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  void shutdown(1);
});

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap product ingestion worker');
  void shutdown(1);
});
