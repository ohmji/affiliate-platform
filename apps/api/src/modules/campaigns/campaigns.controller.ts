import { Body, Controller, Get, Post } from '@nestjs/common';

import { CampaignsService } from './campaigns.service';
import { UpsertCampaignDto } from './dto/upsert-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  listCampaigns() {
    return this.campaignsService.listRecent();
  }

  @Post()
  upsertCampaign(@Body() dto: UpsertCampaignDto) {
    return this.campaignsService.upsert(dto);
  }
}
