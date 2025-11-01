import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../database/entities/campaign.entity';
import { EventBusModule } from '../../events/event-bus.module';
import { QueuesModule } from '../../queues/queues.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    EventBusModule,
    QueuesModule
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService]
})
export class CampaignsModule {}
