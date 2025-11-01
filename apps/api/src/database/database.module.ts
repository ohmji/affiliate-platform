import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from '../config/configuration';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<AppConfig>
      ): TypeOrmModuleOptions => {
        const database = configService.get('database', { infer: true });
        const url = database?.url;

        if (url) {
          return {
            type: 'postgres',
            url,
            autoLoadEntities: true,
            synchronize: false,
            migrationsRun: false,
            migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')]
          };
        }

        return {
          type: 'postgres',
          host: database?.host,
          port: database?.port,
          database: database?.name,
          username: database?.user,
          password: database?.password,
          schema: database?.schema,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')]
        };
      }
    })
  ]
})
export class DatabaseModule {}
