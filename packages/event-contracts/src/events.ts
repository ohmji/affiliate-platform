import { BaseEvent } from './base';

export type Marketplace = 'lazada' | 'shopee';

export type ProductAddedEvent = BaseEvent<
  'product.added.v1',
  {
    productId: string;
    source: 'admin';
    input: {
      url?: string;
      sku?: string;
      marketplace?: Marketplace;
    };
  }
>;

export type OffersRefreshedEvent = BaseEvent<
  'offers.refreshed.v1',
  {
    productId: string;
    offers: Array<{
      marketplace: string;
      storeName: string;
      price: number;
      currency: string;
      lastCheckedAt: string;
    }>;
    best: { marketplace: string; price: number } | null;
  }
>;

export type CampaignCreatedEvent = BaseEvent<
  'campaign.created.v1',
  {
    campaignId: string;
    name: string;
    status: 'draft' | 'published';
    startAt: string | null;
    endAt: string | null;
  }
>;

export type CampaignUpdatedEvent = BaseEvent<
  'campaign.updated.v1',
  {
    campaignId: string;
    name: string;
    status: 'draft' | 'published';
    startAt: string | null;
    endAt: string | null;
  }
>;

export type CampaignPublishedEvent = BaseEvent<
  'campaign.published.v1',
  {
    campaignId: string;
    publishedAt: string;
  }
>;

export type LinkCreatedEvent = BaseEvent<
  'link.created.v1',
  {
    linkId: string;
    productId: string;
    campaignId: string | null;
    shortCode: string;
    marketplace: string;
    targetUrl: string;
  }
>;

export type LinkClickedEvent = BaseEvent<
  'link.clicked.v1',
  {
    linkId: string;
    code: string;
    productId: string;
    campaignId: string | null;
    marketplace: string;
    referrer: string | null;
    userAgent: string | null;
    ipHash: string | null;
  }
>;

export type AnalyticsRollupHourlyEvent = BaseEvent<
  'analytics.rollup.hourly.v1',
  {
    windowStart: string;
    windowEnd: string;
    byProduct: Record<string, { clicks: number; ctr?: number }>;
    byCampaign: Record<string, { clicks: number; ctr?: number }>;
    byMarketplace: Record<string, { clicks: number }>;
  }
>;

export type AnalyticsRollupDailyEvent = BaseEvent<
  'analytics.rollup.daily.v1',
  {
    windowStart: string;
    windowEnd: string;
    byProduct: Record<string, { clicks: number; ctr?: number }>;
    byCampaign: Record<string, { clicks: number; ctr?: number }>;
    byMarketplace: Record<string, { clicks: number }>;
  }
>;

export type KnownEvents =
  | ProductAddedEvent
  | OffersRefreshedEvent
  | LinkCreatedEvent
  | LinkClickedEvent
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignPublishedEvent
  | AnalyticsRollupHourlyEvent
  | AnalyticsRollupDailyEvent;
