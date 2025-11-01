import { LinkCreatedEvent } from '@event-bus/contracts/events';
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';

import { AppConfig } from '../../config/configuration';
import { Campaign } from '../../database/entities/campaign.entity';
import { Link } from '../../database/entities/link.entity';
import { Product } from '../../database/entities/product.entity';
import { EventBusService } from '../../events/event-bus.service';
import { CreateLinkDto } from './dto/create-link.dto';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly eventBus: EventBusService,
    private readonly config: ConfigService<AppConfig>
  ) {}

  async create(dto: CreateLinkDto) {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId }
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    let campaign: Campaign | null = null;
    if (dto.campaignId) {
      campaign = await this.campaignRepository.findOne({
        where: { id: dto.campaignId }
      });
      if (!campaign) {
        throw new NotFoundException(`Campaign ${dto.campaignId} not found`);
      }
    }

    this.ensureTargetUrlAllowed(dto.targetUrl);

    const shortCode = await this.generateUniqueCode();

    const link = this.linkRepository.create({
      productId: product.id,
      campaignId: campaign?.id ?? null,
      shortCode,
      marketplace: dto.marketplace,
      targetUrl: dto.targetUrl,
      utmSource: dto.utmSource ?? 'affiliate',
      utmMedium: dto.utmMedium ?? 'cpc',
      utmCampaign: dto.utmCampaign ?? campaign?.utmCampaign ?? null
    });

    const saved = await this.linkRepository.save(link);

    const event: LinkCreatedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'link.created.v1',
      version: 1,
      data: {
        linkId: saved.id,
        productId: saved.productId,
        campaignId: saved.campaignId,
        shortCode: saved.shortCode,
        marketplace: saved.marketplace,
        targetUrl: saved.targetUrl
      }
    };

    await this.eventBus.publish(event);

    return this.toDto(saved);
  }

  private toDto(link: Link) {
    return {
      id: link.id,
      productId: link.productId,
      campaignId: link.campaignId,
      shortCode: link.shortCode,
      marketplace: link.marketplace,
      targetUrl: link.targetUrl,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign
    };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = ulid().slice(-8).toLowerCase();
      const existing = await this.linkRepository.findOne({
        where: { shortCode: code }
      });
      if (!existing) {
        return code;
      }
    }
    throw new Error('Unable to generate unique short code');
  }

  private ensureTargetUrlAllowed(targetUrl: string) {
    const whitelist =
      this.config.get('security.redirectDomainWhitelist', { infer: true }) ?? [];
    if (!whitelist.length) {
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(targetUrl).hostname;
    } catch (error) {
      throw new BadRequestException('Invalid targetUrl');
    }

    const allowed = whitelist.some((allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
    );
    if (!allowed) {
      throw new BadRequestException(
        `Target URL host ${hostname} is not in allowlist`
      );
    }
  }
}
