import { createHmac } from 'node:crypto';

import { LinkClickedEvent } from '@event-bus/contracts/events';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';

import { AppConfig } from '../../config/configuration';
import { Click } from '../../database/entities/click.entity';
import { Link } from '../../database/entities/link.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QueuesService } from '../../queues/queues.service';

@Injectable()
export class RedirectService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(Click)
    private readonly clickRepository: Repository<Click>,
    private readonly eventBus: EventBusService,
    private readonly queues: QueuesService,
    private readonly config: ConfigService<AppConfig>
  ) {}

  async resolveRedirect(code: string, request: Request) {
    const link = await this.linkRepository.findOne({
      where: { shortCode: code }
    });

    if (!link) {
      throw new NotFoundException(`Link ${code} not found`);
    }

    const click = this.clickRepository.create({
      linkId: link.id,
      occurredAt: new Date(),
      referrer: this.extractReferrer(request),
      userAgent: request.headers['user-agent'] ?? null,
      ipHash: this.hashIp(this.extractIp(request))
    });

    await this.clickRepository.save(click);

    const event: LinkClickedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'link.clicked.v1',
      version: 1,
      data: {
        linkId: link.id,
        code: link.shortCode,
        productId: link.productId,
        campaignId: link.campaignId,
        marketplace: link.marketplace,
        referrer: click.referrer,
        userAgent: click.userAgent,
        ipHash: click.ipHash
      }
    };

    await this.eventBus.publish(event);
    await this.queues.enqueueLinkClicked({
      linkId: link.id,
      clickId: click.id,
      metadata: {
        ipHash: click.ipHash,
        userAgent: click.userAgent,
        referrer: click.referrer
      }
    });

    return {
      targetUrl: link.targetUrl
    };
  }

  private extractReferrer(request: Request) {
    return (request.headers.referer) ?? null;
  }

  private extractIp(request: Request) {
    const header = request.headers['x-forwarded-for'];
    if (typeof header === 'string') {
      return header.split(',')[0]?.trim() ?? request.ip;
    }
    if (Array.isArray(header)) {
      return header[0];
    }
    return request.ip;
  }

  private hashIp(ip: string | undefined | null) {
    if (!ip) {
      return null;
    }

    const secret = this.config.get('security.ipHashSecret', { infer: true }) ?? '';
    return createHmac('sha256', secret).update(ip).digest('hex');
  }
}
