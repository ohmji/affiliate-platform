import { ConfigType } from '@nestjs/config';

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  http: {
    host: process.env.HOST ?? '0.0.0.0',
    port: Number(process.env.PORT ?? 3000),
    cors: {
      origins:
        process.env.CORS_ORIGINS?.split(',').map((entry) => entry.trim()).filter(Boolean) ?? []
    }
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? 'affiliate',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    schema: process.env.DB_SCHEMA ?? 'public'
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME ?? undefined,
    password: process.env.REDIS_PASSWORD ?? undefined,
    tls: process.env.REDIS_TLS === 'true'
  },
  queues: {
    productIngestion: process.env.Q_PRODUCT_INGESTION ?? 'product.added',
    priceRefresh: process.env.Q_PRICE_REFRESH ?? 'price.refresh',
    linkClicked: process.env.Q_LINK_CLICKED ?? 'link.clicked'
  },
  eventBus: {
    streamPrefix: process.env.EVENT_STREAM_PREFIX ?? 'affiliate',
    namespace: process.env.EVENT_NAMESPACE ?? 'default'
  },
  featureFlags: {
    useMockData: process.env.USE_MOCK_DATA === 'true'
  },
  security: {
    ipHashSecret: process.env.IP_HASH_SECRET ?? 'dev-secret',
    redirectDomainWhitelist:
      process.env.REDIRECT_ALLOWLIST?.split(',').map((entry) => entry.trim()) ?? []
  }
});

export type AppConfig = ConfigType<typeof configuration>;
