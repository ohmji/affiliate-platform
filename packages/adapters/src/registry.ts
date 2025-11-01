import { MarketplaceAdapter, ResolveProductInput } from './MarketplaceAdapter';
import { mockAdapter } from './mock/mockAdapter';

const registry: MarketplaceAdapter[] = [mockAdapter];

export function registerAdapter(adapter: MarketplaceAdapter) {
  registry.push(adapter);
}

export function listAdapters() {
  return [...registry];
}

export function pickAdapter(input: ResolveProductInput) {
  const adapter = registry.find((candidate) => candidate.canHandle(input));
  if (!adapter) {
    throw new Error('No adapter available for input');
  }
  return adapter;
}
