import { ulid } from 'ulid';

import { LinkClickedEvent } from '@event-bus/contracts/events';

async function emitMockClicks() {
  const now = new Date();
  const events: LinkClickedEvent[] = Array.from({ length: 3 }).map((_, idx) => ({
    id: ulid(),
    ts: new Date(now.getTime() - idx * 60000).toISOString(),
    type: 'link.clicked.v1',
    version: 1,
    data: {
      linkId: 'mock-link',
      code: 'mock',
      productId: 'mock-product',
      campaignId: null,
      marketplace: idx % 2 === 0 ? 'lazada' : 'shopee',
      referrer: 'https://example.com',
      userAgent: 'mock-agent',
      ipHash: null
    }
  }));

  // eslint-disable-next-line no-console
  console.log('Mock click events ready to enqueue:', events);
}

void emitMockClicks();
