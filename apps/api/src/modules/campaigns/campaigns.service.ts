import {
  CampaignCreatedEvent,
  CampaignPublishedEvent,
  CampaignUpdatedEvent
} from '@event-bus/contracts/events';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';

import { Campaign } from '../../database/entities/campaign.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QueuesService } from '../../queues/queues.service';
import { UpsertCampaignDto } from './dto/upsert-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly eventBus: EventBusService,
    private readonly queues: QueuesService
  ) {}

  async upsert(dto: UpsertCampaignDto) {
    const now = new Date().toISOString();

    if (!dto.id) {
      const campaign = this.campaignRepository.create({
        name: dto.name,
        utmCampaign: dto.utmCampaign ?? null,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        status: dto.status ?? 'draft'
      });
      const saved = await this.campaignRepository.save(campaign);

      const event: CampaignCreatedEvent = {
        id: ulid(),
        ts: now,
        type: 'campaign.created.v1',
        version: 1,
        data: {
          campaignId: saved.id,
          name: saved.name,
          status: saved.status,
          startAt: saved.startAt?.toISOString() ?? null,
          endAt: saved.endAt?.toISOString() ?? null
        }
      };

      await this.eventBus.publish(event);

      if (saved.status === 'published') {
        await this.publishCampaign(saved);
      }

      return this.toDto(saved);
    }

    const existing = await this.campaignRepository.findOne({
      where: { id: dto.id }
    });

    if (!existing) {
      throw new NotFoundException(`Campaign ${dto.id} not found`);
    }

    existing.name = dto.name;
    existing.utmCampaign = dto.utmCampaign ?? null;
    existing.startAt = dto.startAt ? new Date(dto.startAt) : null;
    existing.endAt = dto.endAt ? new Date(dto.endAt) : null;
    const previousStatus = existing.status;
    existing.status = dto.status ?? existing.status;

    const saved = await this.campaignRepository.save(existing);

    const event: CampaignUpdatedEvent = {
      id: ulid(),
      ts: now,
      type: 'campaign.updated.v1',
      version: 1,
      data: {
        campaignId: saved.id,
        name: saved.name,
        status: saved.status,
        startAt: saved.startAt?.toISOString() ?? null,
        endAt: saved.endAt?.toISOString() ?? null
      }
    };

    await this.eventBus.publish(event);

    if (previousStatus !== 'published' && saved.status === 'published') {
      await this.publishCampaign(saved);
    }

    return this.toDto(saved);
  }

  private async publishCampaign(campaign: Campaign) {
    const event: CampaignPublishedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'campaign.published.v1',
      version: 1,
      data: {
        campaignId: campaign.id,
        publishedAt: new Date().toISOString()
      }
    };

    await this.eventBus.publish(event);
    await this.queues.enqueueCampaignPublish({
      campaignId: campaign.id
    });
  }

  private toDto(campaign: Campaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      utmCampaign: campaign.utmCampaign,
      startAt: campaign.startAt?.toISOString() ?? null,
      endAt: campaign.endAt?.toISOString() ?? null,
      status: campaign.status
    };
  }
}
