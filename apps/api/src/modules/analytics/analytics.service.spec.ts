import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let clickRepositoryMock: { createQueryBuilder: jest.Mock };
  let linkRepositoryMock: Record<string, unknown>;
  let productRepositoryMock: { findBy: jest.Mock };
  let campaignRepositoryMock: { findBy: jest.Mock };
  let service: AnalyticsService;

  const createQueryBuilderMock = (
    rows: Array<Record<string, string>>
  ): Record<string, unknown> => {
    const chain = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows)
    };
    return chain;
  };

  beforeEach(() => {
    clickRepositoryMock = {
      createQueryBuilder: jest.fn()
    };
    linkRepositoryMock = {};
    productRepositoryMock = {
      findBy: jest.fn()
    };
    campaignRepositoryMock = {
      findBy: jest.fn()
    };

    service = new AnalyticsService(
      clickRepositoryMock as any,
      linkRepositoryMock as any,
      productRepositoryMock as any,
      campaignRepositoryMock as any
    );
  });

  it('aggregates clicks by product, campaign, and marketplace', async () => {
    clickRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(
        createQueryBuilderMock([
          { productId: 'prod-1', clicks: '10' },
          { productId: 'prod-2', clicks: '5' }
        ])
      )
      .mockReturnValueOnce(
        createQueryBuilderMock([{ campaignId: 'camp-1', clicks: '7' }])
      )
      .mockReturnValueOnce(
        createQueryBuilderMock([
          { marketplace: 'lazada', clicks: '12' },
          { marketplace: 'shopee', clicks: '5' }
        ])
      );

    productRepositoryMock.findBy.mockResolvedValue([
      {
        id: 'prod-1',
        title: 'iPhone 15'
      }
    ]);
    campaignRepositoryMock.findBy.mockResolvedValue([
      {
        id: 'camp-1',
        name: 'Launch'
      }
    ]);

    const snapshot = await service.getDashboardSnapshot();

    expect(productRepositoryMock.findBy).toHaveBeenCalled();
    expect(campaignRepositoryMock.findBy).toHaveBeenCalled();
    expect(snapshot).toEqual({
      byProduct: {
        'prod-1': { clicks: 10, title: 'iPhone 15' },
        'prod-2': { clicks: 5, title: null }
      },
      byCampaign: {
        'camp-1': { clicks: 7, name: 'Launch' }
      },
      byMarketplace: {
        lazada: { clicks: 12 },
        shopee: { clicks: 5 }
      }
    });
  });

  it('returns empty aggregates when there are no clicks', async () => {
    clickRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(createQueryBuilderMock([]))
      .mockReturnValueOnce(createQueryBuilderMock([]))
      .mockReturnValueOnce(createQueryBuilderMock([]));

    productRepositoryMock.findBy.mockResolvedValue([]);
    campaignRepositoryMock.findBy.mockResolvedValue([]);

    const snapshot = await service.getDashboardSnapshot();

    expect(snapshot).toEqual({
      byProduct: {},
      byCampaign: {},
      byMarketplace: {}
    });
  });
});
