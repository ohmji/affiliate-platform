import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Campaign } from '../../database/entities/campaign.entity';
import { Click } from '../../database/entities/click.entity';
import { Link } from '../../database/entities/link.entity';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Click)
    private readonly clickRepository: Repository<Click>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>
  ) {}

  async getDashboardSnapshot() {
    const [byProduct, byCampaign, byMarketplace] = await Promise.all([
      this.aggregateByProduct(),
      this.aggregateByCampaign(),
      this.aggregateByMarketplace()
    ]);

    return {
      byProduct,
      byCampaign,
      byMarketplace
    };
  }

  private async aggregateByProduct() {
    const rows = await this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.link_id')
      .select('link.product_id', 'productId')
      .addSelect('COUNT(*)::int', 'clicks')
      .groupBy('link.product_id')
      .getRawMany<{ productId: string; clicks: string }>();

    if (!rows.length) {
      return {};
    }

    const productIds = rows.map((row) => row.productId);
    const products = await this.productRepository.findBy({
      id: In(productIds)
    });

    const productMap = new Map(products.map((prod) => [prod.id, prod]));

    return rows.reduce<Record<string, { clicks: number; title: string | null }>>(
      (acc, row) => {
        const product = productMap.get(row.productId);
        acc[row.productId] = {
          clicks: Number(row.clicks),
          title: product?.title ?? null
        };
        return acc;
      },
      {}
    );
  }

  private async aggregateByCampaign() {
    const rows = await this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.link_id')
      .where('link.campaign_id IS NOT NULL')
      .select('link.campaign_id', 'campaignId')
      .addSelect('COUNT(*)::int', 'clicks')
      .groupBy('link.campaign_id')
      .getRawMany<{ campaignId: string; clicks: string }>();

    if (!rows.length) {
      return {};
    }

    const campaignIds = rows.map((row) => row.campaignId);
    const campaigns = await this.campaignRepository.findBy({
      id: In(campaignIds)
    });

    const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

    return rows.reduce<Record<string, { clicks: number; name: string | null }>>(
      (acc, row) => {
        const campaign = campaignMap.get(row.campaignId);
        acc[row.campaignId] = {
          clicks: Number(row.clicks),
          name: campaign?.name ?? null
        };
        return acc;
      },
      {}
    );
  }

  private async aggregateByMarketplace() {
    const rows = await this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.link_id')
      .select('link.marketplace', 'marketplace')
      .addSelect('COUNT(*)::int', 'clicks')
      .groupBy('link.marketplace')
      .getRawMany<{ marketplace: string; clicks: string }>();

    return rows.reduce<Record<string, { clicks: number }>>((acc, row) => {
      acc[row.marketplace] = { clicks: Number(row.clicks) };
      return acc;
    }, {});
  }
}
