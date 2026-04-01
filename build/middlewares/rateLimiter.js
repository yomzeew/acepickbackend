"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.heavyLimiter = exports.apiLimiter = exports.authLimiter = exports.otpLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = __importDefault(require("../config/redis"));
// Helper to create a RedisStore with ioredis (falls back to in-memory if Redis unavailable)
const createRedisStore = (prefix) => {
    if (!redis_1.default)
        return undefined; // express-rate-limit uses in-memory by default
    return new rate_limit_redis_1.RedisStore(Object.assign({ sendCommand: (command, ...args) => redis_1.default.call(command, ...args) }, (prefix ? { prefix } : {})));
};
// OTP: strict — 5 requests per 5 minutes
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 5,
    store: createRedisStore('rl:otp:'),
    message: { success: false, message: "Too many OTP requests. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
// Auth endpoints (login, register): 10 requests per 15 minutes
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    store: createRedisStore('rl:auth:'),
    message: { success: false, message: "Too many authentication attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
// General API: 100 requests per minute per IP
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    store: createRedisStore('rl:api:'),
    message: { success: false, message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
// Heavy/expensive endpoints (search, uploads): 20 requests per minute
exports.heavyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    store: createRedisStore('rl:heavy:'),
    message: { success: false, message: "Too many requests to this resource. Please try again shortly." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
// Payment/wallet operations: 10 requests per minute (prevent abuse)
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    store: createRedisStore('rl:payment:'),
    message: { success: false, message: "Too many payment requests. Please wait." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => { var _a; return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip || 'unknown'; },
});
