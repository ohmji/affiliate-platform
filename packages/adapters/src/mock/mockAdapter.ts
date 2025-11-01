import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  MarketplaceAdapter,
  ResolveProductInput,
  ResolvedProduct
} from '../MarketplaceAdapter';

const FIXTURE_ROOT = join(
  __dirname,
  '..',
  '..',
  'mocks',
  'fixtures',
  'v1'
);

async function loadFixture(fileName: string): Promise<ResolvedProduct> {
  const raw = await readFile(join(FIXTURE_ROOT, fileName), 'utf8');
  return JSON.parse(raw);
}

type FixtureRule = {
  file: string;
  keywords: string[];
};

const fallbackFixture = 'lazada-iphone15.json';

const catalog: FixtureRule[] = [
  { file: 'lazada-iphone15.json', keywords: ['iphone', '15'] },
  { file: 'shopee-galaxy-s24.json', keywords: ['galaxy', 's24'] },
  { file: 'lazada-dyson-v15.json', keywords: ['dyson', 'v15'] },
  { file: 'shopee-macbook-air-m3.json', keywords: ['macbook', 'air'] }
];

function pickFixtureFile(input: ResolveProductInput) {
  const haystacks = [input.url, input.sku]
    .map((value) => value?.toLowerCase() ?? '')
    .filter(Boolean);

  if (!haystacks.length) {
    return fallbackFixture;
  }

  for (const rule of catalog) {
    const match = haystacks.some((haystack) =>
      rule.keywords.every((keyword) => haystack.includes(keyword))
    );
    if (match) {
      return rule.file;
    }
  }

  return fallbackFixture;
}

export const mockAdapter: MarketplaceAdapter = {
  name: 'mock',
  canHandle: () => true,
  async resolveProduct(input: ResolveProductInput) {
    const file = pickFixtureFile(input);
    return loadFixture(file);
  }
};
