import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { EventBusModule } from './events/event-bus.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { HealthModule } from './modules/health/health.module';
import { LinksModule } from './modules/links/links.module';
import { ProductsModule } from './modules/products/products.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../../.env', '.env'],
      load: [configuration],
      validate: validateEnv
    }),
    DatabaseModule,
    QueuesModule,
    EventBusModule,
    ProductsModule,
    CampaignsModule,
    LinksModule,
    AnalyticsModule,
    RedirectModule,
    HealthModule
  ]
})
export class AppModule {}
