import { RedisOptions } from 'ioredis';

export type RedisEventBusOptions = {
  streamPrefix: string;
  namespace: string;
  redis: RedisOptions;
};
