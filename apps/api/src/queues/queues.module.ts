import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../database/entities/product.entity';
import { AppConfig } from '../config/configuration';
import { EventBusModule } from '../events/event-bus.module';
import { QUEUES } from './queues.constants';
import { ProductIngestionProcessor } from './processors/product-ingestion.processor';
import { QueuesService } from './queues.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Product]),
    EventBusModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const redis = configService.get('redis', { infer: true });
        return {
          connection: {
            host: redis?.host,
            port: redis?.port,
            username: redis?.username,
            password: redis?.password,
            tls: redis?.tls ? {} : undefined
          }
        };
      }
    }),
    BullModule.registerQueue(
      {
        name: QUEUES.PRODUCT_ADDED
      },
      {
        name: QUEUES.PRICE_REFRESH
      },
      {
        name: QUEUES.LINK_CLICKED
      },
      {
        name: QUEUES.CAMPAIGN_PUBLISH
      }
    )
  ],
  providers: [QueuesService, ProductIngestionProcessor],
  exports: [QueuesService]
})
export class QueuesModule {}
