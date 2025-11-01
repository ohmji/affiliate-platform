import {
  mockAdapter,
  pickAdapter,
  type ResolveProductInput
} from '@adapters/core';
import { OffersRefreshedEvent } from '@event-bus/contracts/events';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';

import type { AppConfig } from '../../config/configuration';
import { Product } from '../../database/entities/product.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QUEUES } from '../queues.constants';
import { Offer } from '../../database/entities/offer.entity';

type ProductAddedJob = {
  productId: string;
  input: ResolveProductInput;
};

const logger = new Logger('ProductIngestionProcessor');

@Processor(QUEUES.PRODUCT_ADDED)
export class ProductIngestionProcessor extends WorkerHost {
  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly eventBus: EventBusService,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>
  ) {
    super();
  }

  async process(job: Job<ProductAddedJob>) {
    const { productId, input } = job.data ?? {};

    if (!productId) {
      logger.warn('Received job without productId, skipping');
      return;
    }

    const adapter = this.selectAdapter(input ?? {});
    logger.log(
      `Resolving product ${productId} via adapter ${adapter.name} (jobId=${job.id})`
    );

    const resolved = await adapter.resolveProduct(input ?? {});

    if (!resolved?.product) {
      throw new Error(`Adapter ${adapter.name} returned no product payload`);
    }

    const offers = await this.persistProduct(productId, resolved, input ?? {});
    await this.publishOffersRefreshed(productId, offers);
  }

  private selectAdapter(input: ResolveProductInput) {
    const useMock = this.configService.get('featureFlags.useMockData', {
      infer: true
    });

    if (useMock) {
      return mockAdapter;
    }

    try {
      return pickAdapter(input);
    } catch (error) {
      logger.warn(
        `Falling back to mock adapter for product input. Reason: ${(error as Error)?.message}`
      );
      return mockAdapter;
    }
  }

  private async persistProduct(
    productId: string,
    resolved: {
      product: { title: string; imageUrl?: string };
      offers: Array<{
        marketplace: 'lazada' | 'shopee';
        storeName: string;
        price: number;
        currency?: string;
      }>;
    },
    input: ResolveProductInput
  ) {
    const normalizedSku = input.sku?.toLowerCase() ?? null;
    const normalizedUrl = input.url?.trim() ?? null;
    const rawInput =
      Object.keys(input).length > 0
        ? {
            marketplace: input.marketplace ?? null,
            sku: input.sku ?? null,
            url: input.url ?? null
          }
        : null;

    const timestamp = new Date();

    return this.productsRepository.manager.transaction(async (transaction) => {
      const productRepo = transaction.getRepository(Product);
      const offerRepo = transaction.getRepository(Offer);

      let product = await productRepo.findOne({ where: { id: productId } });
      if (!product) {
        product = productRepo.create({
          id: productId,
          source: 'admin'
        });
      }

      product.title = resolved.product.title ?? product.title ?? null;
      product.imageUrl = resolved.product.imageUrl ?? product.imageUrl ?? null;
      product.normalizedSku = normalizedSku ?? product.normalizedSku ?? null;
      product.normalizedUrl = normalizedUrl ?? product.normalizedUrl ?? null;
      product.rawInput = rawInput;

      await productRepo.save(product);

      await offerRepo.delete({ productId });

      const offerEntities = resolved.offers.map((offer) =>
        offerRepo.create({
          productId,
          marketplace: offer.marketplace,
          storeName: offer.storeName,
          price: Number(offer.price),
          currency: offer.currency ?? 'THB',
          lastCheckedAt: timestamp
        })
      );

      const persisted = await offerRepo.save(offerEntities);

      return persisted.map((offer) => ({
        marketplace: offer.marketplace,
        storeName: offer.storeName,
        price: Number(offer.price),
        currency: offer.currency,
        lastCheckedAt: offer.lastCheckedAt ?? timestamp
      }));
    });
  }

  private async publishOffersRefreshed(
    productId: string,
    offers: Array<{
      marketplace: string;
      storeName: string;
      price: number;
      currency: string;
      lastCheckedAt: Date;
    }>
  ) {
    const offersForEvent: OffersRefreshedEvent['data']['offers'] = offers.map(
      (offer) => ({
        marketplace: offer.marketplace,
        storeName: offer.storeName,
        price: offer.price,
        currency: offer.currency,
        lastCheckedAt: offer.lastCheckedAt.toISOString()
      })
    );

    const best = this.pickBestOffer(offersForEvent);

    const event: OffersRefreshedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'offers.refreshed.v1',
      version: 1,
      data: {
        productId,
        offers: offersForEvent,
        best
      }
    };

    await this.eventBus.publish(event);
    logger.log(`Published offers.refreshed for product ${productId}`);
  }

  private pickBestOffer(
    offers: Array<{ marketplace: string; price: number }>
  ): { marketplace: string; price: number } | null {
    if (!offers.length) {
      return null;
    }

    const sorted = [...offers].sort((a, b) => a.price - b.price);
    const best = sorted[0];
    return {
      marketplace: best.marketplace,
      price: best.price
    };
  }
}
