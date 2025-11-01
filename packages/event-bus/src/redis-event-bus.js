"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventBus = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const pino_1 = __importDefault(require("pino"));
class RedisEventBus {
    constructor(options) {
        this.options = options;
        this.logger = (0, pino_1.default)({
            name: 'RedisEventBus',
            level: process.env.LOG_LEVEL ?? 'info'
        });
        this.streamPrefix = options.streamPrefix;
        this.namespace = options.namespace;
        this.redis = new ioredis_1.default(options.redis);
    }
    async publish(event) {
        const stream = this.buildStreamName(event.type);
        const payload = JSON.stringify(event);
        this.logger.debug({ eventType: event.type, stream }, 'Publishing event');
        await this.redis.xadd(stream, '*', 'event', payload);
    }
    async close() {
        await this.redis.quit();
    }
    buildStreamName(eventType) {
        return `${this.streamPrefix}:${this.namespace}:${eventType}`;
    }
}
exports.RedisEventBus = RedisEventBus;
//# sourceMappingURL=redis-event-bus.js.map