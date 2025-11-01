import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { QUEUES } from './queues.constants';

type ProductAddedJob = {
  productId: string;
  input: {
    url?: string;
    sku?: string;
    marketplace?: string;
  };
};

type CampaignPublishJob = {
  campaignId: string;
};

type LinkClickedJob = {
  linkId: string;
  clickId: number;
  metadata: {
    ipHash: string | null;
    userAgent: string | null;
    referrer: string | null;
  };
};

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue(QUEUES.PRODUCT_ADDED)
    private readonly productAddedQueue: Queue<ProductAddedJob>,
    @InjectQueue(QUEUES.PRICE_REFRESH)
    private readonly priceRefreshQueue: Queue,
    @InjectQueue(QUEUES.LINK_CLICKED)
    private readonly linkClickedQueue: Queue<LinkClickedJob>,
    @InjectQueue(QUEUES.CAMPAIGN_PUBLISH)
    private readonly campaignPublishQueue: Queue<CampaignPublishJob>
  ) {}

  async enqueueProductAdded(job: ProductAddedJob) {
    await this.productAddedQueue.add('ingest', job, {
      jobId: job.productId,
      removeOnComplete: true,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }

  async enqueuePriceRefresh(productId: string) {
    await this.priceRefreshQueue.add('refresh', { productId }, { jobId: productId });
  }

  async enqueueLinkClicked(job: LinkClickedJob) {
    await this.linkClickedQueue.add('click', job, {
      removeOnComplete: true,
      attempts: 3
    });
  }

  async enqueueCampaignPublish(job: CampaignPublishJob) {
    await this.campaignPublishQueue.add('publish', job, {
      jobId: job.campaignId,
      removeOnComplete: true
    });
  }
}
