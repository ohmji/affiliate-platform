import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../database/entities/campaign.entity';
import { Link } from '../../database/entities/link.entity';
import { Product } from '../../database/entities/product.entity';
import { EventBusModule } from '../../events/event-bus.module';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Link, Product, Campaign]),
    EventBusModule
  ],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService]
})
export class LinksModule {}
