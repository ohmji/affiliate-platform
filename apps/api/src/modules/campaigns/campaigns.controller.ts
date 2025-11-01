import { Body, Controller, Post } from '@nestjs/common';

import { CampaignsService } from './campaigns.service';
import { UpsertCampaignDto } from './dto/upsert-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  upsertCampaign(@Body() dto: UpsertCampaignDto) {
    return this.campaignsService.upsert(dto);
  }
}
