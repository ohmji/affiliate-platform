export const QUEUES = {
  PRODUCT_ADDED: 'product.added',
  PRICE_REFRESH: 'price.refresh',
  LINK_CLICKED: 'link.clicked',
  CAMPAIGN_PUBLISH: 'campaign.publish'
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
