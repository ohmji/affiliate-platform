import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../database/entities/campaign.entity';
import { Click } from '../../database/entities/click.entity';
import { Link } from '../../database/entities/link.entity';
import { Product } from '../../database/entities/product.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Click, Link, Product, Campaign])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
