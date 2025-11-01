import { NotFoundException } from '@nestjs/common';

import { Campaign } from '../../database/entities/campaign.entity';
import { EventBusService } from '../../events/event-bus.service';
import { QueuesService } from '../../queues/queues.service';
import { CampaignsService } from './campaigns.service';

describe('CampaignsService', () => {
  const now = new Date('2024-02-01T00:00:00.000Z');
  let campaignRepositoryMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let eventBusMock: { publish: jest.Mock };
  let queuesMock: { enqueueCampaignPublish: jest.Mock };
  let service: CampaignsService;

  beforeEach(() => {
    jest.useFakeTimers({ now });

    campaignRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn()
    };
    eventBusMock = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    queuesMock = {
      enqueueCampaignPublish: jest.fn().mockResolvedValue(undefined)
    };

    service = new CampaignsService(
      campaignRepositoryMock as unknown as any,
      eventBusMock as unknown as EventBusService,
      queuesMock as unknown as QueuesService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('creates campaign in draft status and emits created event', async () => {
    campaignRepositoryMock.create.mockImplementation((data) => ({ ...data }));
    campaignRepositoryMock.save.mockResolvedValue({
      id: 'campaign-1',
      name: 'Holiday Deals',
      utmCampaign: 'holiday',
      startAt: new Date('2024-03-01T00:00:00.000Z'),
      endAt: null,
      status: 'draft'
    });

    const result = await service.upsert({
      name: 'Holiday Deals',
      utmCampaign: 'holiday',
      startAt: '2024-03-01T00:00:00.000Z'
    });

    expect(campaignRepositoryMock.create).toHaveBeenCalledWith({
      name: 'Holiday Deals',
      utmCampaign: 'holiday',
      startAt: new Date('2024-03-01T00:00:00.000Z'),
      endAt: null,
      status: 'draft'
    });
    expect(eventBusMock.publish).toHaveBeenCalledTimes(1);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'campaign.created.v1',
        data: expect.objectContaining({
          campaignId: 'campaign-1',
          status: 'draft',
          name: 'Holiday Deals'
        })
      })
    );
    expect(queuesMock.enqueueCampaignPublish).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 'campaign-1',
      name: 'Holiday Deals',
      utmCampaign: 'holiday',
      startAt: '2024-03-01T00:00:00.000Z',
      endAt: null,
      status: 'draft'
    });
  });

  it('publishes campaign immediately when status is published on create', async () => {
    campaignRepositoryMock.create.mockImplementation((data) => ({ ...data }));
    const savedCampaign: Campaign = {
      id: 'campaign-2',
      name: 'Flash Sale',
      utmCampaign: null,
      startAt: null,
      endAt: null,
      status: 'published',
      createdAt: now,
      updatedAt: now
    } as Campaign;
    campaignRepositoryMock.save.mockResolvedValue(savedCampaign);

    await service.upsert({
      name: 'Flash Sale',
      status: 'published'
    });

    expect(eventBusMock.publish).toHaveBeenCalledTimes(2);
    expect(eventBusMock.publish).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'campaign.created.v1',
        data: expect.objectContaining({
          campaignId: 'campaign-2',
          status: 'published'
        })
      })
    );
    expect(eventBusMock.publish).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'campaign.published.v1',
        data: expect.objectContaining({
          campaignId: 'campaign-2',
          publishedAt: now.toISOString()
        })
      })
    );
    expect(queuesMock.enqueueCampaignPublish).toHaveBeenCalledWith({
      campaignId: 'campaign-2'
    });
  });

  it('updates campaign and emits updated and published events when status changes', async () => {
    const existingCampaign: Campaign = {
      id: 'campaign-3',
      name: 'Spring Promo',
      utmCampaign: null,
      startAt: null,
      endAt: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    } as Campaign;
    campaignRepositoryMock.findOne.mockResolvedValue(existingCampaign);
    campaignRepositoryMock.save.mockImplementation(async () => existingCampaign);

    const result = await service.upsert({
      id: 'campaign-3',
      name: 'Spring Promo 2024',
      status: 'published'
    });

    expect(eventBusMock.publish).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'campaign.updated.v1',
        data: expect.objectContaining({
          campaignId: 'campaign-3',
          status: 'published',
          name: 'Spring Promo 2024'
        })
      })
    );
    expect(eventBusMock.publish).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'campaign.published.v1',
        data: expect.objectContaining({
          campaignId: 'campaign-3'
        })
      })
    );
    expect(queuesMock.enqueueCampaignPublish).toHaveBeenCalledWith({
      campaignId: 'campaign-3'
    });
    expect(result).toEqual({
      id: 'campaign-3',
      name: 'Spring Promo 2024',
      utmCampaign: null,
      startAt: null,
      endAt: null,
      status: 'published'
    });
  });

  it('throws when trying to update a missing campaign', async () => {
    campaignRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.upsert({
        id: 'missing',
        name: 'Missing',
        status: 'draft'
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
