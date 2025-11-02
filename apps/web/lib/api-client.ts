import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

export type ProductOffer = {
  id: string;
  marketplace: string;
  storeName: string;
  price: number;
  currency: string;
  lastCheckedAt: string;
};

export type ProductOffersResponse = {
  product: {
    id: string;
    title: string | null;
    imageUrl: string | null;
  };
  offers: ProductOffer[];
  best: { marketplace: string; price: number } | null;
};

export type ProductSummary = {
  id: string;
  title: string | null;
  normalizedSku: string | null;
  normalizedUrl: string | null;
  createdAt: string;
};

export type CampaignSummary = {
  id: string;
  name: string;
  status: 'draft' | 'published';
  utmCampaign: string | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
};

export type DashboardSnapshot = {
  byProduct: Record<string, { clicks: number; title: string | null }>;
  byCampaign: Record<string, { clicks: number; name: string | null }>;
  byMarketplace: Record<string, { clicks: number }>;
};

export async function fetchProductOffers(productId: string) {
  const response = await apiClient.get<ProductOffersResponse>(
    `/products/${productId}/offers`
  );
  return response.data;
}

export async function createProduct(payload: {
  url?: string;
  sku?: string;
  marketplace?: 'lazada' | 'shopee';
}) {
  const response = await apiClient.post<{ id: string }>('/products', payload);
  return response.data;
}

export async function fetchProducts(): Promise<ProductSummary[]> {
  const response = await apiClient.get<ProductSummary[]>('/products');
  return response.data;
}

export async function upsertCampaign(payload: {
  id?: string;
  name: string;
  utmCampaign?: string;
  startAt?: string;
  endAt?: string;
  status?: 'draft' | 'published';
}) {
  const response = await apiClient.post('/campaigns', payload);
  return response.data;
}

export async function fetchCampaigns(): Promise<CampaignSummary[]> {
  const response = await apiClient.get<CampaignSummary[]>('/campaigns');
  return response.data;
}

export async function createLink(payload: {
  productId: string;
  campaignId?: string | null;
  marketplace: 'lazada' | 'shopee';
  targetUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  const response = await apiClient.post<LinkResponse>('/links', payload);
  return response.data;
}

export async function fetchDashboard(): Promise<DashboardSnapshot> {
  const response = await apiClient.get<DashboardSnapshot>('/dashboard');
  return response.data;
}

export type LinkResponse = {
  id: string;
  productId: string;
  campaignId?: string | null;
  shortCode: string;
  marketplace: string;
  targetUrl: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};
