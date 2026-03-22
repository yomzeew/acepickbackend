import Redis from "ioredis";
import config from "./configSetup"

let redis: Redis | null = null;

if (config.REDIS_HOST || config.REDIS_INSTANCE_URL) {
    const options = config.REDIS_INSTANCE_URL
        ? config.REDIS_INSTANCE_URL
        : {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            password: config.REDIS_PASSWORD,
        };

    redis = new Redis(options as any, {
        retryStrategy(times) {
            if (times > 3) {
                console.warn('⚠️ Redis: max retries reached, giving up');
                return null; // stop retrying
            }
            return Math.min(times * 1000, 5000);
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });

    redis.on("connect", () => console.log("✅ Connected to Redis"));
    redis.on("ready", () => console.log("🚀 Redis is ready to use"));
    redis.on("error", (err) => console.error("❌ Redis error:", err.message));
    redis.on("end", () => console.warn("⚠️ Redis connection closed"));

    // Attempt connection but don't block startup
    redis.connect().catch(() => {
        console.warn('⚠️ Redis not available — running without Redis');
    });
} else {
    console.log('ℹ️ Redis not configured — running without Redis (caching & rate-limit store disabled)');
}

export default redis;
