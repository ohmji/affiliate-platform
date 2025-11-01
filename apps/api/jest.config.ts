import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json'
      }
    ]
  },
  moduleNameMapper: {
    '^@event-bus/contracts$': '<rootDir>/../../packages/event-contracts/dist',
    '^@event-bus/contracts/(.*)$': '<rootDir>/../../packages/event-contracts/dist/$1',
    '^@event-bus/redis-event-bus$': '<rootDir>/../../packages/event-bus/dist',
    '^@event-bus/redis-event-bus/(.*)$': '<rootDir>/../../packages/event-bus/dist/$1',
    '^@adapters/core$': '<rootDir>/../../packages/adapters/dist',
    '^@adapters/core/(.*)$': '<rootDir>/../../packages/adapters/dist/$1',
    '^@adapters/(.*)$': '<rootDir>/../../packages/adapters/dist/$1'
  }
};

export default config;
