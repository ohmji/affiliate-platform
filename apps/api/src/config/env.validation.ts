import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => Number(val)),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => val ?? ''),
  DATABASE_URL: z.string().optional().or(z.literal('')),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z
    .string()
    .default('5432')
    .transform((val) => Number(val)),
  DB_NAME: z.string().default('affiliate'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SCHEMA: z.string().default('public'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => Number(val)),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  Q_PRODUCT_INGESTION: z.string().default('product.added'),
  Q_PRICE_REFRESH: z.string().default('price.refresh'),
  Q_LINK_CLICKED: z.string().default('link.clicked'),
  EVENT_STREAM_PREFIX: z.string().default('affiliate'),
  EVENT_NAMESPACE: z.string().default('default'),
  USE_MOCK_DATA: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  IP_HASH_SECRET: z.string().default('dev-secret'),
  REDIRECT_ALLOWLIST: z.string().optional()
});

export type EnvVars = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }
  return result.data;
}
