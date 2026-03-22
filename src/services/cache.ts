import redis from '../config/redis';

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Redis caching service for frequently accessed data.
 * All operations gracefully no-op when Redis is unavailable.
 */
export const CacheService = {
    async get(key: string): Promise<any | null> {
        if (!redis) return null;
        try {
            const cached = await redis.get(key);
            if (!cached) return null;
            return JSON.parse(cached);
        } catch (error) {
            return null;
        }
    },

    async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
        if (!redis) return;
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) { /* silent */ }
    },

    async del(key: string): Promise<void> {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) { /* silent */ }
    },

    async delPattern(pattern: string): Promise<void> {
        if (!redis) return;
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) { /* silent */ }
    },

    async getOrSet(key: string, fetcher: () => Promise<any>, ttl: number = DEFAULT_TTL): Promise<any> {
        if (!redis) return fetcher();
        const cached = await this.get(key);
        if (cached !== null) return cached;

        const fresh = await fetcher();
        await this.set(key, fresh, ttl);
        return fresh;
    },

    async invalidateUser(userId: string): Promise<void> {
        await this.delPattern(`user:${userId}:*`);
    },

    async invalidateProducts(): Promise<void> {
        await this.delPattern('products:*');
    },

    async invalidateCategories(): Promise<void> {
        await this.delPattern('categories:*');
    },

    async isHealthy(): Promise<boolean> {
        if (!redis) return false;
        try {
            const pong = await redis.ping();
            return pong === 'PONG';
        } catch {
            return false;
        }
    },
};
