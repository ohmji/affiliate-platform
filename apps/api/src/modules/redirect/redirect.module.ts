import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Click } from '../../database/entities/click.entity';
import { Link } from '../../database/entities/link.entity';
import { EventBusModule } from '../../events/event-bus.module';
import { QueuesModule } from '../../queues/queues.module';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [TypeOrmModule.forFeature([Link, Click]), EventBusModule, QueuesModule],
  controllers: [RedirectController],
  providers: [RedirectService]
})
export class RedirectModule {}
