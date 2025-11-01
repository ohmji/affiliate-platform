import { BaseEvent, EventBusProducer } from '@event-bus/contracts/base';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { EVENT_BUS_CLIENT } from './event-bus.constants';

@Injectable()
export class EventBusService implements OnModuleDestroy {
  constructor(
    @Inject(EVENT_BUS_CLIENT) private readonly producer: EventBusProducer
  ) {}

  async publish<TEvent extends BaseEvent<string, unknown>>(event: TEvent) {
    await this.producer.publish(event);
  }

  async onModuleDestroy() {
    if (typeof this.producer.close === 'function') {
      await this.producer.close();
    }
  }
}
