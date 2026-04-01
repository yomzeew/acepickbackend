"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const DEFAULT_TTL = 300; // 5 minutes
/**
 * Redis caching service for frequently accessed data.
 * All operations gracefully no-op when Redis is unavailable.
 */
exports.CacheService = {
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redis_1.default)
                return null;
            try {
                const cached = yield redis_1.default.get(key);
                if (!cached)
                    return null;
                return JSON.parse(cached);
            }
            catch (error) {
                return null;
            }
        });
    },
    set(key_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (key, value, ttl = DEFAULT_TTL) {
            if (!redis_1.default)
                return;
            try {
                yield redis_1.default.set(key, JSON.stringify(value), 'EX', ttl);
            }
            catch (error) { /* silent */ }
        });
    },
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redis_1.default)
                return;
            try {
                yield redis_1.default.del(key);
            }
            catch (error) { /* silent */ }
        });
    },
    delPattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redis_1.default)
                return;
            try {
                const keys = yield redis_1.default.keys(pattern);
                if (keys.length > 0) {
                    yield redis_1.default.del(...keys);
                }
            }
            catch (error) { /* silent */ }
        });
    },
    getOrSet(key_1, fetcher_1) {
        return __awaiter(this, arguments, void 0, function* (key, fetcher, ttl = DEFAULT_TTL) {
            if (!redis_1.default)
                return fetcher();
            const cached = yield this.get(key);
            if (cached !== null)
                return cached;
            const fresh = yield fetcher();
            yield this.set(key, fresh, ttl);
            return fresh;
        });
    },
    invalidateUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delPattern(`user:${userId}:*`);
        });
    },
    invalidateProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delPattern('products:*');
        });
    },
    invalidateCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delPattern('categories:*');
        });
    },
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!redis_1.default)
                return false;
            try {
                const pong = yield redis_1.default.ping();
                return pong === 'PONG';
            }
            catch (_a) {
                return false;
            }
        });
    },
};
