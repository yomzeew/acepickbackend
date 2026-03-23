import axios from 'axios';
import prisma from '../config/prisma';
import { NotificationType } from '../utils/enum';

// ─── Types ───────────────────────────────────────────────────

export interface CreateNotificationParams {
    userId: string;
    type: NotificationType | string;
    title: string;
    message: string;
    data?: Record<string, any>;
    sendPush?: boolean;  // default true
    channelId?: string;  // Android notification channel (e.g. 'calls')
    priority?: 'default' | 'normal' | 'high'; // push priority
    categoryId?: string; // Notification category for action buttons (e.g. 'INCOMING_CALL')
}

// ─── Expo Push (low-level) ───────────────────────────────────

export async function sendPushNotification(
    expoPushToken: string,
    title: string,
    message: string,
    data: any,
    options?: { channelId?: string; priority?: 'default' | 'normal' | 'high'; categoryId?: string }
) {
    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send?useFcmV1=true', {
            to: expoPushToken,
            sound: 'default',
            title,
            body: message,
            data,
            ...(options?.channelId && { channelId: options.channelId }),
            ...(options?.priority && { priority: options.priority }),
            ...(options?.categoryId && { categoryId: options.categoryId }),
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        if (response.status <= 300) {
            return { status: true, message: response.data };
        } else {
            console.error('Push notification failed:', response.data);
            return { status: false, message: response.data };
        }
    } catch (error: any) {
        console.error('Error sending push notification:', error.response?.data || error.message);
        return { status: false, message: error.message };
    }
}

// ─── Batch push (Expo supports up to 100 per request) ────────

export async function sendBatchPushNotifications(
    tokens: string[],
    title: string,
    message: string,
    data: any
) {
    const messages = tokens.filter(Boolean).map(token => ({
        to: token,
        sound: 'default' as const,
        title,
        body: message,
        data,
    }));

    if (messages.length === 0) return;

    // Expo recommends chunks of 100
    const chunks: typeof messages[] = [];
    for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
        try {
            await axios.post('https://exp.host/--/api/v2/push/send?useFcmV1=true', chunk, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
        } catch (error: any) {
            console.error('Batch push error:', error.response?.data || error.message);
        }
    }
}

// ─── NotificationService (DB + Push) ─────────────────────────

export const NotificationService = {
    /**
     * Create an in-app notification and optionally send a push notification.
     */
    async create(params: CreateNotificationParams) {
        const { userId, type, title, message, data, sendPush = true, channelId, priority, categoryId } = params;

        // 1. Store in DB
        const notification = await prisma.notification.create({
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
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { fcmToken: true }
                });

                if (user?.fcmToken) {
                    console.log(`[push] Sending to user=${userId} token=${user.fcmToken.substring(0, 20)}...`);
                    const result = await sendPushNotification(
                        user.fcmToken,
                        title,
                        message,
                        { notificationId: notification.id, type, ...data },
                        { channelId, priority, categoryId }
                    );
                    console.log(`[push] Result:`, result);

                    if (result?.status) {
                        await prisma.notification.update({
                            where: { id: notification.id },
                            data: { pushSent: true }
                        });
                    }
                } else {
                    console.warn(`[push] No fcmToken for user=${userId} — push skipped`);
                }
            } catch (error) {
                console.error('Push notification error (DB record still saved):', error);
            }
        }

        return notification;
    },

    /**
     * Send notification to multiple users at once.
     */
    async createBulk(
        userIds: string[],
        type: NotificationType | string,
        title: string,
        message: string,
        data?: Record<string, any>
    ) {
        // 1. Bulk insert notifications
        await prisma.notification.createMany({
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
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { fcmToken: true }
            });

            const tokens = users.map(u => u.fcmToken).filter(Boolean) as string[];
            if (tokens.length > 0) {
                await sendBatchPushNotifications(tokens, title, message, { type, ...data });
            }
        } catch (error) {
            console.error('Bulk push error:', error);
        }
    },

    /**
     * Get paginated notifications for a user.
     */
    async getByUserId(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, read: false } }),
        ]);

        return {
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    /**
     * Mark a single notification as read.
     */
    async markAsRead(notificationId: number, userId: string) {
        return prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true },
        });
    },

    /**
     * Mark all notifications as read for a user.
     */
    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    },

    /**
     * Delete a single notification.
     */
    async delete(notificationId: number, userId: string) {
        return prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    },

    /**
     * Delete all notifications for a user.
     */
    async deleteAll(userId: string) {
        return prisma.notification.deleteMany({
            where: { userId },
        });
    },

    /**
     * Get unread count for a user.
     */
    async getUnreadCount(userId: string) {
        return prisma.notification.count({
            where: { userId, read: false },
        });
    },
};
