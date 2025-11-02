import {
  OffersRefreshedEvent,
  ProductAddedEvent
} from '@event-bus/contracts/events';
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';

import { Offer } from '../../database/entities/offer.entity';
import { Product } from '../../database/entities/product.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QueuesService } from '../../queues/queues.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    private readonly eventBus: EventBusService,
    private readonly queues: QueuesService
  ) {}

  async listProducts() {
    const products = await this.productsRepository.find({
      order: { createdAt: 'DESC' },
      take: 50
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      normalizedSku: product.normalizedSku,
      normalizedUrl: product.normalizedUrl,
      createdAt: product.createdAt.toISOString()
    }));
  }

  async createProduct(dto: CreateProductDto) {
    if (!dto.url && !dto.sku) {
      throw new BadRequestException('Either url or sku is required');
    }

    const product = this.productsRepository.create({
      source: dto.source ?? 'admin',
      normalizedSku: dto.sku?.toLowerCase() ?? null,
      normalizedUrl: dto.url?.trim() ?? null,
      rawInput: {
        marketplace: dto.marketplace ?? null,
        url: dto.url ?? null,
        sku: dto.sku ?? null
      }
    });

    const saved = await this.productsRepository.save(product);

    const event: ProductAddedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'product.added.v1',
      version: 1,
      data: {
        productId: saved.id,
        source: 'admin',
        input: {
          url: dto.url ?? undefined,
          sku: dto.sku ?? undefined,
          marketplace: dto.marketplace ?? undefined
        }
      }
    };

    await this.eventBus.publish(event);
    await this.queues.enqueueProductAdded({
      productId: saved.id,
      input: event.data.input
    });

    return { id: saved.id };
  }

  async getOffers(productId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: { offers: true }
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const offers = (product.offers ?? []).map((offer) => ({
      id: offer.id,
      marketplace: offer.marketplace,
      storeName: offer.storeName,
      price: Number(offer.price),
      currency: offer.currency,
      lastCheckedAt: offer.lastCheckedAt.toISOString()
    }));

    const best = this.pickBestOffer(offers);

    const event: OffersRefreshedEvent = {
      id: ulid(),
      ts: new Date().toISOString(),
      type: 'offers.refreshed.v1',
      version: 1,
      data: {
        productId: product.id,
        offers,
        best
      }
    };

    await this.eventBus.publish(event);

    return {
      product: {
        id: product.id,
        title: product.title,
        imageUrl: product.imageUrl
      },
      offers,
      best
    };
  }

  private pickBestOffer(
    offers: Array<{
      marketplace: string;
      price: number;
      storeName: string;
      currency: string;
      lastCheckedAt: string;
    }>
  ) {
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
