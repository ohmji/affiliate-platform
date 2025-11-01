import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppConfig } from '../config/configuration';
import { QUEUES } from './queues.constants';
import { QueuesService } from './queues.service';

@Module({
  imports: [
    ConfigModule,
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
  providers: [QueuesService],
  exports: [QueuesService]
})
export class QueuesModule {}
