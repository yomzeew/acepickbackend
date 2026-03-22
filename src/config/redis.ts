import Redis from "ioredis";
import config from "./configSetup"

let redis: Redis | null = null;

const commonOpts = {
    retryStrategy(times: number) {
        if (times > 3) {
            console.warn('⚠️ Redis: max retries reached, giving up');
            return null;
        }
        return Math.min(times * 1000, 5000);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
};

if (config.REDIS_INSTANCE_URL) {
    // Upstash or other cloud Redis with a full URL (supports rediss:// for TLS)
    const useTls = config.REDIS_INSTANCE_URL.startsWith('rediss://');
    redis = new Redis(config.REDIS_INSTANCE_URL, {
        ...commonOpts,
        ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
} else if (config.REDIS_HOST) {
    // Self-hosted Redis with host/port/password
    redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        ...commonOpts,
    });
}

if (redis) {
    redis.on("connect", () => console.log("✅ Connected to Redis"));
    redis.on("ready", () => console.log("🚀 Redis is ready to use"));
    redis.on("error", (err) => console.error("❌ Redis error:", err.message));
    redis.on("end", () => console.warn("⚠️ Redis connection closed"));

    redis.connect().catch(() => {
        console.warn('⚠️ Redis not available — running without Redis');
    });
} else {
    console.log('ℹ️ Redis not configured — running without Redis (caching & rate-limit store disabled)');
}

export default redis;
