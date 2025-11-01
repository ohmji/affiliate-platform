import Redis from 'ioredis';
import pino from 'pino';

import { BaseEvent, EventBusProducer } from '@event-bus/contracts/base';
import { RedisEventBusOptions } from './types';

export class RedisEventBus implements EventBusProducer {
  private readonly redis: Redis;

  private readonly logger = pino({
    name: 'RedisEventBus',
    level: process.env.LOG_LEVEL ?? 'info'
  });

  private readonly streamPrefix: string;

  private readonly namespace: string;

  constructor(private readonly options: RedisEventBusOptions) {
    this.streamPrefix = options.streamPrefix;
    this.namespace = options.namespace;
    this.redis = new Redis(options.redis);
  }

  async publish<TEvent extends BaseEvent<string, unknown>>(event: TEvent) {
    const stream = this.buildStreamName(event.type);
    const payload = JSON.stringify(event);

    this.logger.debug({ eventType: event.type, stream }, 'Publishing event');

    await this.redis.xadd(stream, '*', 'event', payload);
  }

  async close() {
    await this.redis.quit();
  }

  private buildStreamName(eventType: string) {
    return `${this.streamPrefix}:${this.namespace}:${eventType}`;
  }
}
