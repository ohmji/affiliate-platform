import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Offer } from '../../database/entities/offer.entity';
import { Product } from '../../database/entities/product.entity';
import { EventBusModule } from '../../events/event-bus.module';
import { QueuesModule } from '../../queues/queues.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Offer]),
    EventBusModule,
    QueuesModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
