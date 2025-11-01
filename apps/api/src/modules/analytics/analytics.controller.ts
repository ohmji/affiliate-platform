import { Controller, Get } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

@Controller('dashboard')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getDashboard() {
    return this.analyticsService.getDashboardSnapshot();
  }
}
