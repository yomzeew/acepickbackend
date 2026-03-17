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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notification_1 = require("../services/notification");
const modules_1 = require("../utils/modules");
/**
 * GET /notifications
 * Query params: ?page=1&limit=20&unreadOnly=false
 */
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const unreadOnly = req.query.unreadOnly === 'true';
        if (unreadOnly) {
            const { notifications, total, unreadCount, totalPages } = yield notification_1.NotificationService.getByUserId(id, page, limit);
            const filtered = notifications.filter(n => !n.read);
            return (0, modules_1.successResponse)(res, 'Notifications fetched', {
                notifications: filtered,
                total: unreadCount,
                unreadCount,
                page,
                totalPages: Math.ceil(unreadCount / limit),
            });
        }
        const result = yield notification_1.NotificationService.getByUserId(id, page, limit);
        return (0, modules_1.successResponse)(res, 'Notifications fetched', result);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to fetch notifications', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.getNotifications = getNotifications;
/**
 * GET /notifications/unread-count
 */
const getUnreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const count = yield notification_1.NotificationService.getUnreadCount(id);
        return (0, modules_1.successResponse)(res, 'Unread count fetched', { unreadCount: count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to fetch unread count', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.getUnreadCount = getUnreadCount;
/**
 * PUT /notifications/:notificationId/read
 */
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const notificationId = parseInt(req.params.notificationId);
        if (isNaN(notificationId)) {
            return (0, modules_1.errorResponse)(res, 'Invalid notification ID');
        }
        yield notification_1.NotificationService.markAsRead(notificationId, id);
        return (0, modules_1.successResponse)(res, 'Notification marked as read');
    }
    catch (error) {
        console.error('Mark as read error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to mark notification as read', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.markAsRead = markAsRead;
/**
 * PUT /notifications/read-all
 */
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const result = yield notification_1.NotificationService.markAllAsRead(id);
        return (0, modules_1.successResponse)(res, 'All notifications marked as read', { count: result.count });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to mark all as read', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.markAllAsRead = markAllAsRead;
/**
 * DELETE /notifications/:notificationId
 */
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const notificationId = parseInt(req.params.notificationId);
        if (isNaN(notificationId)) {
            return (0, modules_1.errorResponse)(res, 'Invalid notification ID');
        }
        yield notification_1.NotificationService.delete(notificationId, id);
        return (0, modules_1.successResponse)(res, 'Notification deleted');
    }
    catch (error) {
        console.error('Delete notification error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to delete notification', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.deleteNotification = deleteNotification;
/**
 * DELETE /notifications
 */
const deleteAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const result = yield notification_1.NotificationService.deleteAll(id);
        return (0, modules_1.successResponse)(res, 'All notifications deleted', { count: result.count });
    }
    catch (error) {
        console.error('Delete all notifications error:', error);
        return (0, modules_1.errorResponse)(res, 'Failed to delete all notifications', error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.deleteAllNotifications = deleteAllNotifications;
