import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis";

// Helper to create a RedisStore with ioredis (falls back to in-memory if Redis unavailable)
const createRedisStore = (prefix?: string) => {
    if (!redis) return undefined; // express-rate-limit uses in-memory by default
    return new RedisStore({
        sendCommand: (command: string, ...args: string[]) =>
            redis.call(command, ...args) as any,
        ...(prefix ? { prefix } : {}),
    });
};

// OTP: strict — 5 requests per 5 minutes
export const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    store: createRedisStore('rl:otp:'),
    message: { success: false, message: "Too many OTP requests. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});

// Auth endpoints (login, register): 10 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    store: createRedisStore('rl:auth:'),
    message: { success: false, message: "Too many authentication attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});

// General API: 100 requests per minute per IP
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    store: createRedisStore('rl:api:'),
    message: { success: false, message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});

// Heavy/expensive endpoints (search, uploads): 20 requests per minute
export const heavyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    store: createRedisStore('rl:heavy:'),
    message: { success: false, message: "Too many requests to this resource. Please try again shortly." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});

// Payment/wallet operations: 10 requests per minute (prevent abuse)
export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    store: createRedisStore('rl:payment:'),
    message: { success: false, message: "Too many payment requests. Please wait." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
});
