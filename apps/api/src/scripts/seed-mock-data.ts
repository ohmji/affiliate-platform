import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { config as loadEnv } from 'dotenv';

import { createDataSource } from '../database/data-source';
import { Campaign } from '../database/entities/campaign.entity';
import { Link } from '../database/entities/link.entity';
import { Offer } from '../database/entities/offer.entity';
import { Product } from '../database/entities/product.entity';

type Fixture = {
  product: {
    title: string;
    imageUrl?: string;
  };
  offers: Array<{
    marketplace: 'lazada' | 'shopee';
    storeName: string;
    price: number;
    currency: string;
  }>;
};

async function loadFixture(): Promise<Fixture> {
  const fixturePath = join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'adapters',
    'mocks',
    'fixtures',
    'v1',
    'lazada-iphone15.json'
  );
  const raw = await readFile(fixturePath, 'utf8');
  return JSON.parse(raw) as Fixture;
}

async function seed() {
  loadEnv({ path: process.env.ENV_FILE ?? '.env' });

  const dataSource = createDataSource();
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();

  const hasProductsTable = await queryRunner.hasTable('products');
  if (!hasProductsTable) {
    await queryRunner.release();
    throw new Error(
      'Database schema missing. Run "pnpm --filter @apps/api migration:run" before seeding.'
    );
  }
  await queryRunner.release();

  try {
    const fixture = await loadFixture();

    const productRepository = dataSource.getRepository(Product);
    const offerRepository = dataSource.getRepository(Offer);
    const campaignRepository = dataSource.getRepository(Campaign);
    const linkRepository = dataSource.getRepository(Link);

    const existingProduct = await productRepository.findOne({
      where: { normalizedSku: 'iphone-15-mock' }
    });

    const product =
      existingProduct ??
      productRepository.create({
        id: randomUUID(),
        title: fixture.product.title,
        imageUrl: fixture.product.imageUrl ?? null,
        source: 'admin',
        normalizedSku: 'iphone-15-mock',
        normalizedUrl: 'https://mock.example/products/iphone-15',
        rawInput: {
          marketplace: 'lazada',
          sku: 'IPHONE15-MOCK',
          url: 'https://mock.example/products/iphone-15'
        }
      });

    await productRepository.save(product);

    await offerRepository.delete({ productId: product.id });

    const offers = fixture.offers.map((offer) =>
      offerRepository.create({
        id: randomUUID(),
        productId: product.id,
        marketplace: offer.marketplace,
        storeName: offer.storeName,
        price: offer.price,
        currency: offer.currency,
        lastCheckedAt: new Date()
      })
    );

    await offerRepository.save(offers);

    const campaign =
      (await campaignRepository.findOne({
        where: { name: 'iPhone 15 Launch Promo' }
      })) ??
      campaignRepository.create({
        id: randomUUID(),
        name: 'iPhone 15 Launch Promo',
        utmCampaign: 'iphone-15-launch',
        startAt: new Date(),
        status: 'published'
      });

    await campaignRepository.save(campaign);

    const link =
      (await linkRepository.findOne({
        where: { shortCode: 'iphone15' }
      })) ??
      linkRepository.create({
        id: randomUUID(),
        productId: product.id,
        campaignId: campaign.id,
        shortCode: 'iphone15',
        marketplace: 'lazada',
        targetUrl:
          'https://www.lazada.co.th/products/iphone-15-mock-affiliate?utm_source=affiliate&utm_medium=cpc',
        utmSource: 'affiliate',
        utmMedium: 'cpc',
        utmCampaign: campaign.utmCampaign ?? 'iphone-15-launch'
      });

    await linkRepository.save(link);

    // eslint-disable-next-line no-console
    console.log('✅ Mock data seeded successfully', {
      productId: product.id,
      offers: offers.length,
      campaignId: campaign.id,
      linkId: link.id
    });
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to seed mock data', error);
  process.exitCode = 1;
});
