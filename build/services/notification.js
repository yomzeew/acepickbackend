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
exports.NotificationService = void 0;
exports.sendPushNotification = sendPushNotification;
exports.sendBatchPushNotifications = sendBatchPushNotifications;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Expo Push (low-level) ───────────────────────────────────
function sendPushNotification(expoPushToken, title, message, data, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.post('https://exp.host/--/api/v2/push/send?useFcmV1=true', Object.assign(Object.assign(Object.assign({ to: expoPushToken, sound: 'default', title, body: message, data }, ((options === null || options === void 0 ? void 0 : options.channelId) && { channelId: options.channelId })), ((options === null || options === void 0 ? void 0 : options.priority) && { priority: options.priority })), ((options === null || options === void 0 ? void 0 : options.categoryId) && { categoryId: options.categoryId })), {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            if (response.status <= 300) {
                return { status: true, message: response.data };
            }
            else {
                console.error('Push notification failed:', response.data);
                return { status: false, message: response.data };
            }
        }
        catch (error) {
            console.error('Error sending push notification:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            return { status: false, message: error.message };
        }
    });
}
// ─── Batch push (Expo supports up to 100 per request) ────────
function sendBatchPushNotifications(tokens, title, message, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const messages = tokens.filter(Boolean).map(token => ({
            to: token,
            sound: 'default',
            title,
            body: message,
            data,
        }));
        if (messages.length === 0)
            return;
        // Expo recommends chunks of 100
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }
        for (const chunk of chunks) {
            try {
                yield axios_1.default.post('https://exp.host/--/api/v2/push/send?useFcmV1=true', chunk, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                });
            }
            catch (error) {
                console.error('Batch push error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            }
        }
    });
}
// ─── NotificationService (DB + Push) ─────────────────────────
exports.NotificationService = {
    /**
     * Create an in-app notification and optionally send a push notification.
     */
    create(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, type, title, message, data, sendPush = true, channelId, priority, categoryId } = params;
            // 1. Store in DB
            const notification = yield prisma_1.default.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    data: data || undefined,
                    pushSent: false,
                }
            });
            // 2. Optionally send push
            if (sendPush) {
                try {
                    const user = yield prisma_1.default.user.findUnique({
                        where: { id: userId },
                        select: { fcmToken: true }
                    });
                    if (user === null || user === void 0 ? void 0 : user.fcmToken) {
                        console.log(`[push] Sending to user=${userId} token=${user.fcmToken.substring(0, 20)}...`);
                        const result = yield sendPushNotification(user.fcmToken, title, message, Object.assign({ notificationId: notification.id, type }, data), { channelId, priority, categoryId });
                        console.log(`[push] Result:`, result);
                        if (result === null || result === void 0 ? void 0 : result.status) {
                            yield prisma_1.default.notification.update({
                                where: { id: notification.id },
                                data: { pushSent: true }
                            });
                        }
                    }
                    else {
                        console.warn(`[push] No fcmToken for user=${userId} — push skipped`);
                    }
                }
                catch (error) {
                    console.error('Push notification error (DB record still saved):', error);
                }
            }
            return notification;
        });
    },
    /**
     * Send notification to multiple users at once.
     */
    createBulk(userIds, type, title, message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Bulk insert notifications
            yield prisma_1.default.notification.createMany({
                data: userIds.map(userId => ({
                    userId,
                    type,
                    title,
                    message,
                    data: data || undefined,
                    pushSent: false,
                }))
            });
            // 2. Batch push
            try {
                const users = yield prisma_1.default.user.findMany({
                    where: { id: { in: userIds } },
                    select: { fcmToken: true }
                });
                const tokens = users.map(u => u.fcmToken).filter(Boolean);
                if (tokens.length > 0) {
                    yield sendBatchPushNotifications(tokens, title, message, Object.assign({ type }, data));
                }
            }
            catch (error) {
                console.error('Bulk push error:', error);
            }
        });
    },
    /**
     * Get paginated notifications for a user.
     */
    getByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const [notifications, total, unreadCount] = yield Promise.all([
                prisma_1.default.notification.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma_1.default.notification.count({ where: { userId } }),
                prisma_1.default.notification.count({ where: { userId, read: false } }),
            ]);
            return {
                notifications,
                total,
                unreadCount,
                page,
                totalPages: Math.ceil(total / limit),
            };
        });
    },
    /**
     * Mark a single notification as read.
     */
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.updateMany({
                where: { id: notificationId, userId },
                data: { read: true },
            });
        });
    },
    /**
     * Mark all notifications as read for a user.
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });
        });
    },
    /**
     * Delete a single notification.
     */
    delete(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.deleteMany({
                where: { id: notificationId, userId },
            });
        });
    },
    /**
     * Delete all notifications for a user.
     */
    deleteAll(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.deleteMany({
                where: { userId },
            });
        });
    },
    /**
     * Get unread count for a user.
     */
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.count({
                where: { userId, read: false },
            });
        });
    },
};
