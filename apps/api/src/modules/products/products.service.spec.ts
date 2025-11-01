import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Offer } from '../../database/entities/offer.entity';
import { Product } from '../../database/entities/product.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QueuesService } from '../../queues/queues.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const now = new Date('2024-01-01T00:00:00.000Z');
  let productRepoMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let offerRepoMock: Record<string, jest.Mock>;
  let eventBusMock: { publish: jest.Mock };
  let queuesMock: { enqueueProductAdded: jest.Mock };
  let service: ProductsService;

  beforeEach(() => {
    jest.useFakeTimers({ now });

    productRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn()
    };
    offerRepoMock = {};
    eventBusMock = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    queuesMock = {
      enqueueProductAdded: jest.fn().mockResolvedValue(undefined)
    };

    service = new ProductsService(
      productRepoMock as unknown as any,
      offerRepoMock as unknown as any,
      eventBusMock as unknown as EventBusService,
      queuesMock as unknown as QueuesService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('throws when neither url nor sku is provided', async () => {
    await expect(service.createProduct({} as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(productRepoMock.create).not.toHaveBeenCalled();
  });

  it('saves product, publishes event, and enqueues job on create', async () => {
    const savedProduct: Partial<Product> = {
      id: 'product-123'
    };
    productRepoMock.create.mockImplementation((data) => ({ ...data }));
    productRepoMock.save.mockResolvedValue(savedProduct);

    const result = await service.createProduct({
      url: ' https://example.com/item ',
      sku: 'SKU-123',
      marketplace: 'lazada'
    });

    expect(productRepoMock.create).toHaveBeenCalledWith({
      source: 'admin',
      normalizedSku: 'sku-123',
      normalizedUrl: 'https://example.com/item',
      rawInput: {
        marketplace: 'lazada',
        url: ' https://example.com/item ',
        sku: 'SKU-123'
      }
    });
    expect(productRepoMock.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'product-123' });
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'product.added.v1',
        data: {
          productId: 'product-123',
          source: 'admin',
          input: {
            url: ' https://example.com/item ',
            sku: 'SKU-123',
            marketplace: 'lazada'
          }
        }
      })
    );
    expect(queuesMock.enqueueProductAdded).toHaveBeenCalledWith({
      productId: 'product-123',
      input: {
        url: ' https://example.com/item ',
        sku: 'SKU-123',
        marketplace: 'lazada'
      }
    });
  });

  it('throws when product is missing during offer retrieval', async () => {
    productRepoMock.findOne.mockResolvedValue(null);

    await expect(service.getOffers('missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('returns offers, emits event, and computes best price', async () => {
    const offers: Offer[] = [
      {
        id: 'offer-1',
        productId: 'product-1',
        marketplace: 'shopee',
        storeName: 'Store B',
        price: 1200,
        currency: 'THB',
        lastCheckedAt: new Date('2024-01-01T01:00:00.000Z')
      } as Offer,
      {
        id: 'offer-2',
        productId: 'product-1',
        marketplace: 'lazada',
        storeName: 'Store A',
        price: 1100,
        currency: 'THB',
        lastCheckedAt: new Date('2024-01-01T02:00:00.000Z')
      } as Offer
    ];

    productRepoMock.findOne.mockResolvedValue({
      id: 'product-1',
      title: 'Test Product',
      imageUrl: 'https://example.com/image.jpg',
      offers
    });

    const response = await service.getOffers('product-1');

    expect(response).toEqual({
      product: {
        id: 'product-1',
        title: 'Test Product',
        imageUrl: 'https://example.com/image.jpg'
      },
      offers: [
        {
          id: 'offer-1',
          marketplace: 'shopee',
          storeName: 'Store B',
          price: 1200,
          currency: 'THB',
          lastCheckedAt: '2024-01-01T01:00:00.000Z'
        },
        {
          id: 'offer-2',
          marketplace: 'lazada',
          storeName: 'Store A',
          price: 1100,
          currency: 'THB',
          lastCheckedAt: '2024-01-01T02:00:00.000Z'
        }
      ],
      best: {
        marketplace: 'lazada',
        price: 1100
      }
    });

    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'offers.refreshed.v1',
        data: expect.objectContaining({
          productId: 'product-1',
          best: {
            marketplace: 'lazada',
            price: 1100
          }
        })
      })
    );
  });
});
