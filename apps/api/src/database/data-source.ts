import 'reflect-metadata';

import { join } from 'node:path';

import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

function resolveDataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  if (url && url.length > 0) {
    return {
      type: 'postgres',
      url,
      entities: [join(__dirname, 'entities/**/*{.ts,.js}')],
      migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
      migrationsTableName: 'typeorm_migrations',
      synchronize: false,
      logging: false
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'affiliate',
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    schema: process.env.DB_SCHEMA ?? 'public',
    entities: [join(__dirname, 'entities/**/*{.ts,.js}')],
    migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: false
  };
}

export function createDataSource() {
  return new DataSource(resolveDataSourceOptions());
}

export const AppDataSource = createDataSource();

export default AppDataSource;
