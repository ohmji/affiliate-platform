import { RedisEventBus } from '@event-bus/redis-event-bus';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppConfig } from '../config/configuration';
import { EVENT_BUS_CLIENT } from './event-bus.constants';
import { EventBusService } from './event-bus.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EVENT_BUS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const redis = configService.get('redis', { infer: true });
        const eventBusConfig = configService.get('eventBus', { infer: true });

        return new RedisEventBus({
          streamPrefix: eventBusConfig?.streamPrefix ?? 'affiliate',
          namespace: eventBusConfig?.namespace ?? 'default',
          redis: {
            host: redis?.host ?? 'localhost',
            port: redis?.port ?? 6379,
            username: redis?.username,
            password: redis?.password,
            tls: redis?.tls ? {} : undefined
          }
        });
      }
    },
    EventBusService
  ],
  exports: [EventBusService]
})
export class EventBusModule {}
