import { Request, Response } from 'express';
import { NotificationService } from '../services/notification';
import { successResponse, errorResponse } from '../utils/modules';

/**
 * GET /notifications
 * Query params: ?page=1&limit=20&unreadOnly=false
 */
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const unreadOnly = req.query.unreadOnly === 'true';

        if (unreadOnly) {
            const { notifications, total, unreadCount, totalPages } =
                await NotificationService.getByUserId(id, page, limit);

            const filtered = notifications.filter(n => !n.read);
            return successResponse(res, 'Notifications fetched', {
                notifications: filtered,
                total: unreadCount,
                unreadCount,
                page,
                totalPages: Math.ceil(unreadCount / limit),
            });
        }

        const result = await NotificationService.getByUserId(id, page, limit);
        return successResponse(res, 'Notifications fetched', result);
    } catch (error: any) {
        console.error('Get notifications error:', error);
        return errorResponse(res, 'Failed to fetch notifications', error?.message);
    }
};

/**
 * GET /notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const count = await NotificationService.getUnreadCount(id);
        return successResponse(res, 'Unread count fetched', { unreadCount: count });
    } catch (error: any) {
        console.error('Get unread count error:', error);
        return errorResponse(res, 'Failed to fetch unread count', error?.message);
    }
};

/**
 * PUT /notifications/:notificationId/read
 */
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const notificationId = parseInt(req.params.notificationId);

        if (isNaN(notificationId)) {
            return errorResponse(res, 'Invalid notification ID');
        }

        await NotificationService.markAsRead(notificationId, id);
        return successResponse(res, 'Notification marked as read');
    } catch (error: any) {
        console.error('Mark as read error:', error);
        return errorResponse(res, 'Failed to mark notification as read', error?.message);
    }
};

/**
 * PUT /notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const result = await NotificationService.markAllAsRead(id);
        return successResponse(res, 'All notifications marked as read', { count: result.count });
    } catch (error: any) {
        console.error('Mark all as read error:', error);
        return errorResponse(res, 'Failed to mark all as read', error?.message);
    }
};

/**
 * DELETE /notifications/:notificationId
 */
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const notificationId = parseInt(req.params.notificationId);

        if (isNaN(notificationId)) {
            return errorResponse(res, 'Invalid notification ID');
        }

        await NotificationService.delete(notificationId, id);
        return successResponse(res, 'Notification deleted');
    } catch (error: any) {
        console.error('Delete notification error:', error);
        return errorResponse(res, 'Failed to delete notification', error?.message);
    }
};

/**
 * DELETE /notifications
 */
export const deleteAllNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const result = await NotificationService.deleteAll(id);
        return successResponse(res, 'All notifications deleted', { count: result.count });
    } catch (error: any) {
        console.error('Delete all notifications error:', error);
        return errorResponse(res, 'Failed to delete all notifications', error?.message);
    }
};
