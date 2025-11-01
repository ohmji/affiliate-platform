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

function isLikelyIphone(input: ResolveProductInput) {
  return Boolean(
    input.url?.toLowerCase().includes('iphone') ||
      input.sku?.toLowerCase().includes('iphone')
  );
}

export const mockAdapter: MarketplaceAdapter = {
  name: 'mock',
  canHandle: () => true,
  async resolveProduct(input: ResolveProductInput) {
    if (isLikelyIphone(input)) {
      return loadFixture('lazada-iphone15.json');
    }
    return loadFixture('lazada-iphone15.json');
  }
};
