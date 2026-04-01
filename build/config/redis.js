"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const configSetup_1 = __importDefault(require("./configSetup"));
let redis = null;
const commonOpts = {
    retryStrategy(times) {
        if (times > 3) {
            console.warn('⚠️ Redis: max retries reached, giving up');
            return null;
        }
        return Math.min(times * 1000, 5000);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
};
if (configSetup_1.default.REDIS_INSTANCE_URL) {
    // Upstash or other cloud Redis with a full URL (supports rediss:// for TLS)
    const useTls = configSetup_1.default.REDIS_INSTANCE_URL.startsWith('rediss://');
    redis = new ioredis_1.default(configSetup_1.default.REDIS_INSTANCE_URL, Object.assign(Object.assign({}, commonOpts), (useTls ? { tls: { rejectUnauthorized: false } } : {})));
}
else if (configSetup_1.default.REDIS_HOST) {
    // Self-hosted Redis with host/port/password
    redis = new ioredis_1.default(Object.assign({ host: configSetup_1.default.REDIS_HOST, port: configSetup_1.default.REDIS_PORT, password: configSetup_1.default.REDIS_PASSWORD }, commonOpts));
}
if (redis) {
    redis.on("connect", () => console.log("✅ Connected to Redis"));
    redis.on("ready", () => console.log("🚀 Redis is ready to use"));
    redis.on("error", (err) => console.error("❌ Redis error:", err.message));
    redis.on("end", () => console.warn("⚠️ Redis connection closed"));
    redis.connect().catch(() => {
        console.warn('⚠️ Redis not available — running without Redis');
    });
}
else {
    console.log('ℹ️ Redis not configured — running without Redis (caching & rate-limit store disabled)');
}
exports.default = redis;
