export type ResolveProductInput = {
  url?: string;
  sku?: string;
  marketplace?: 'lazada' | 'shopee';
};

export type ResolvedProduct = {
  product: { title: string; imageUrl?: string };
  offers: Array<{
    marketplace: 'lazada' | 'shopee';
    storeName: string;
    price: number;
    currency: string;
  }>;
};

export interface MarketplaceAdapter {
  name: string;
  canHandle(input: ResolveProductInput): boolean;
  resolveProduct(input: ResolveProductInput): Promise<ResolvedProduct>;
}
