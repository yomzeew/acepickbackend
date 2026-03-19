import { Request, Response } from "express";
import { deliverySchema, disputeSchema } from "../validation/body";
import prisma from "../config/prisma";
import { Accounts, CommissionScope, EntryCategory, OrderMethod, OrderStatus, ProductTransactionStatus, RiderStatus, TransactionStatus, TransactionType, NotificationType } from "../utils/enum";
import { errorResponse, getDistanceFromLatLonInKm, handleResponse, randomId, successResponse } from "../utils/modules";
import { getOrdersSchema } from "../validation/query";
import { CommissionService } from "../services/CommissionService";
import { LedgerService } from "../services/ledgerService";
import { disputedOrderEmail, resolveDisputeEmail } from "../utils/messages";
import { sendEmail } from "../services/gmail";
import { NotificationService } from "../services/notification";
import { getIO } from "../chat";
import { Emit } from "../utils/events";

const ORDER_EXPIRY_MINUTES = 15;

// ─────────────── Helper: notify nearby riders via push + socket ───────────────
export const notifyNearbyRiders = async (order: any, pickupLat: number, pickupLong: number, dropoffLat: number, dropoffLong: number) => {
    try {
        const riders = await prisma.rider.findMany({
            where: { status: RiderStatus.AVAILABLE as any },
            include: { user: { include: { location: true, profile: true } } }
        });

        const io = getIO();
        const eligibleRiderUserIds: string[] = [];

        for (const rider of riders) {
            const loc = rider.user.location[0];
            if (!loc?.latitude || !loc?.longitude) continue;

            const dist = getDistanceFromLatLonInKm(loc.latitude, loc.longitude, pickupLat, pickupLong);
            if (dist > 50) continue; // within 50km radius

            eligibleRiderUserIds.push(rider.userId);

            // Real-time socket notification
            const onlineUser = await prisma.onlineUser.findFirst({ where: { userId: rider.userId } });
            if (onlineUser?.isOnline) {
                io.to(onlineUser.socketId).emit(Emit.NEW_DELIVERY_REQUEST, {
                    text: 'New delivery request available',
                    data: order,
                });
            }
        }

        // Bulk push notification
        if (eligibleRiderUserIds.length > 0) {
            await NotificationService.createBulk(
                eligibleRiderUserIds,
                NotificationType.ORDER,
                'New Delivery Request',
                `Delivery #${order.id} — ₦${Number(order.cost).toLocaleString()} fee. Tap to accept.`,
                { orderId: order.id }
            );
        }

        return eligibleRiderUserIds.length;
    } catch (err) {
        console.error('notifyNearbyRiders error:', err);
        return 0;
    }
};

// ─────────────── Helper: notify other riders that request is closed ───────────────
const notifyRidersRequestClosed = async (orderId: number, assignedRiderId: string) => {
    try {
        const io = getIO();

        // Find all riders who got the original notification (online + available)
        const riders = await prisma.rider.findMany({
            where: { status: RiderStatus.AVAILABLE as any, userId: { not: assignedRiderId } },
            include: { user: true }
        });

        for (const rider of riders) {
            const onlineUser = await prisma.onlineUser.findFirst({ where: { userId: rider.userId } });
            if (onlineUser?.isOnline) {
                io.to(onlineUser.socketId).emit(Emit.DELIVERY_REQUEST_CLOSED, {
                    text: 'Delivery request has been assigned to another rider',
                    data: { orderId },
                });
            }
        }
    } catch (err) {
        console.error('notifyRidersRequestClosed error:', err);
    }
};

// ─────────────── Retry expired order ───────────────
export const retryExpiredOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await prisma.order.findFirst({
            where: {
                id: Number(orderId),
                status: OrderStatus.EXPIRED as any
            },
            include: {
                productTransaction: {
                    include: {
                        product: true,
                        buyer: { select: { id: true } }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Expired order not found' });
        }

        if (order.productTransaction.buyerId !== userId) {
            return res.status(403).json({ error: 'You can only retry your own orders' });
        }

        // Check if product still has enough stock
        if (order.productTransaction.product.quantity < order.productTransaction.quantity) {
            return res.status(400).json({ error: 'Product no longer has enough stock' });
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Restore stock first (in case it wasn't restored properly)
            await tx.product.update({
                where: { id: order.productTransaction.productId },
                data: { quantity: { increment: order.productTransaction.quantity } }
            });

            // Reserve stock again
            await tx.product.update({
                where: { id: order.productTransaction.productId },
                data: { quantity: { decrement: order.productTransaction.quantity } }
            });

            // Reset order with new expiry
            const newExpiresAt = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);
            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.PENDING as any,
                    expiresAt: newExpiresAt,
                    riderId: null
                }
            });

            // Reset product transaction status
            await tx.productTransaction.update({
                where: { id: order.productTransactionId },
                data: { status: ProductTransactionStatus.PENDING as any }
            });

            return updatedOrder;
        });

        // Notify user about retry
        await NotificationService.create({
            userId,
            type: NotificationType.ORDER,
            title: 'Order Retry Available',
            message: `Your order #${order.id} has been retried. Please complete payment within ${ORDER_EXPIRY_MINUTES} minutes.`,
            data: { orderId: order.id }
        });

        return successResponse(res, 'success', {
            message: 'Order retried successfully',
            expiresAt: result.expiresAt
        });
    } catch (error: any) {
        console.error('retryExpiredOrder error:', error);
        return errorResponse(res, 'error', error.message || 'Failed to retry order');
    }
};

// ─────────────── Clean up expired unpaid orders ───────────────
export const cleanupExpiredUnpaidOrders = async (req: Request, res: Response) => {
    try {
        const expiredOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PENDING as any,
                expiresAt: { lt: new Date() }
            },
            include: {
                productTransaction: {
                    include: {
                        product: { select: { id: true, quantity: true } },
                        buyer: { include: { profile: true } }
                    }
                }
            }
        });

        for (const order of expiredOrders) {
            // Use transaction to ensure data consistency
            await prisma.$transaction(async (tx) => {
                // Update order status to expired
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: OrderStatus.EXPIRED as any }
                });

                // Restore stock to product
                if (order.productTransaction?.product) {
                    await tx.product.update({
                        where: { id: order.productTransaction.product.id },
                        data: { 
                            quantity: { increment: order.productTransaction.quantity }
                        }
                    });
                }

                // Update product transaction status
                await tx.productTransaction.update({
                    where: { id: order.productTransactionId },
                    data: { status: ProductTransactionStatus.PENDING as any }
                });
            });

            // Notify buyer about expired order
            await NotificationService.create({
                userId: order.productTransaction.buyerId,
                type: NotificationType.ORDER,
                title: 'Order Expired',
                message: `Your order #${order.id} has expired due to non-payment. Stock has been restored. Please place a new order if still interested.`,
                data: { orderId: order.id }
            });

            console.log(`Cleaned up expired order #${order.id} and restored ${order.productTransaction.quantity} units to stock`);
        }

        return successResponse(res, 'success', { cleaned: expiredOrders.length });
    } catch (err) {
        console.error('cleanupExpiredUnpaidOrders error:', err);
        return errorResponse(res, 'error', 'Error cleaning up expired orders');
    }
};

// ─────────────── CREATE ORDER (delivery) ───────────────
export const createOrder = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const parsed = deliverySchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }

        const { productTransactionId, receiverLat, receiverLong, address, locationId, vehicleType } = parsed.data;

        const productTransaction = await prisma.productTransaction.findFirst({
            where: { id: productTransactionId, buyerId: id },
            include: {
                product: { include: { pickupLocation: true } },
                buyer: { include: { profile: true } }
            }
        });

        if (!productTransaction) {
            return res.status(400).json({ errors: 'Product transaction not found' });
        }

        if (productTransaction.orderMethod !== OrderMethod.DELIVERY) {
            return res.status(400).json({ errors: 'Product transaction not meant for delivery' });
        }

        let existingLocation: any = null;

        if (locationId) {
            existingLocation = await prisma.location.findFirst({
                where: { id: locationId, userId: id }
            });
        } else {
            existingLocation = await prisma.location.create({
                data: {
                    latitude: receiverLat,
                    longitude: receiverLong,
                    address,
                    userId: id
                }
            });
        }

        if (!existingLocation) {
            return res.status(400).json({ errors: 'Dropoff location not found for product' });
        }

        if (!productTransaction.product.pickupLocation) {
            return res.status(400).json({ errors: 'Pickup location not found for product' });
        }

        const vendorLat = productTransaction.product.pickupLocation.latitude;
        const vendorLong = productTransaction.product.pickupLocation.longitude;
        const clientLat = existingLocation?.latitude;
        const clientLong = existingLocation?.longitude;

        const distance = getDistanceFromLatLonInKm(vendorLat, vendorLong, clientLat, clientLong);

        const pricing = await prisma.deliveryPricing.findFirst({
            where: { vehicleType: vehicleType as any }
        });

        if (!pricing) {
            return res.status(400).json({ errors: 'Delivery pricing not found for the vehicle type' });
        }

        const distanceCost = distance * Number(pricing.costPerKm);
        const totalWeight = Number(productTransaction.product.weightPerUnit) * Number(productTransaction.quantity);
        const weightCost = totalWeight * Number(pricing.costPerKg);
        const baseCost = Number(pricing.baseCost);
        const totalCost = distanceCost + weightCost + baseCost;

        const expiresAt = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);

        const order = await prisma.order.create({
            data: {
                productTransactionId,
                cost: totalCost,
                distance,
                weight: totalWeight,
                deliveryFee: totalCost,
                locationId: existingLocation.id,
                pickupAddress: productTransaction.product.pickupLocation?.address || null,
                deliveryAddress: existingLocation.address || null,
                expiresAt,
            },
            include: {
                dropoffLocation: true,
                productTransaction: {
                    include: {
                        product: { include: { pickupLocation: true } },
                        seller: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
                        buyer: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
                    }
                }
            }
        });

        await prisma.activity.create({
            data: {
                userId: id,
                action: `${productTransaction.buyer.profile?.firstName} ${productTransaction.buyer.profile?.lastName} has created Order #${order.id}`,
                type: 'Order created',
                status: 'success' as any
            }
        });

        // Notify vendor
        await NotificationService.create({
            userId: productTransaction.sellerId,
            type: NotificationType.ORDER,
            title: 'New Order',
            message: `${productTransaction.buyer.profile?.firstName} ordered ${productTransaction.quantity}x ${productTransaction.product.name}. Delivery requested.`,
            data: { orderId: order.id, productTransactionId },
        });

        return successResponse(res, 'success', {
            ...order,
            totalCost: Number(order.cost) + Number(productTransaction.price),
        });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error creating order');
    }
};


export const getNearestPaidOrders = async (req: Request, res: Response) => {
    const { id } = req.user

    try {
        const rider = await prisma.rider.findFirst({
            where: { userId: id },
            include: { user: { include: { location: true } } }
        })

        if (!rider) {
            return handleResponse(res, 404, false, 'You are not a rider')
        }

        const riderLat = rider.user.location[0]?.latitude;
        const riderLong = rider.user.location[0]?.longitude;

        if (!riderLat || !riderLong) {
            return handleResponse(res, 400, false, 'Please update your location')
        }

        const orders = await prisma.order.findMany({
            where: {
                riderId: null,
                status: OrderStatus.PAID as any,
            },
            include: {
                dropoffLocation: true,
                productTransaction: {
                    include: {
                        product: {
                            include: {
                                pickupLocation: {
                                    select: { latitude: true, longitude: true }
                                }
                            }
                        },
                        seller: {
                            select: {
                                id: true, email: true,
                                profile: { select: { id: true, avatar: true, firstName: true, lastName: true } }
                            }
                        },
                        buyer: {
                            select: {
                                id: true, email: true,
                                profile: { select: { id: true, avatar: true, firstName: true, lastName: true } }
                            }
                        }
                    }
                }
            }
        });

        const ordersWithDistance = orders.map((order: any) => {
            const pickup = order.productTransaction?.product?.pickupLocation;

            if (pickup && pickup.latitude && pickup.longitude) {
                const distance = getDistanceFromLatLonInKm(
                    riderLat, riderLong,
                    pickup.latitude, pickup.longitude
                );
                return { ...order, distance };
            }
            return { ...order, distance: null };
        });

        ordersWithDistance.sort((a: any, b: any) => a.distance - b.distance);

        return successResponse(res, 'success', ordersWithDistance);
    } catch (error) {
        console.error('Error in getNearestPaidOrders:', error);
        return errorResponse(res, 'error', error instanceof Error ? error.message : 'Error fetching orders')
    }
}


const orderProductTransactionInclude = {
    include: {
        product: { include: { pickupLocation: true } },
        seller: {
            select: {
                id: true, email: true,
                profile: { select: { id: true, avatar: true, firstName: true, lastName: true } }
            }
        },
        buyer: {
            select: {
                id: true, email: true,
                profile: { select: { id: true, avatar: true, firstName: true, lastName: true } }
            }
        }
    }
};

export const getOrdersRider = async (req: Request, res: Response) => {
    const { id } = req.user;

    const parsed = getOrdersSchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { status, page, limit } = parsed.data;

    try {
        const orders = await prisma.order.findMany({
            where: {
                riderId: id,
                ...((status && status !== 'all') ? { status: status as any } : {})
            },
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', orders);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error fetching orders')
    }
}

export const getOrdersBuyer = async (req: Request, res: Response) => {
    const { id } = req.user;

    const parsed = getOrdersSchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { status, page, limit } = parsed.data;

    try {
        const orders = await prisma.order.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                productTransaction: { buyerId: id }
            },
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', orders)
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error fetching orders')
    }
}


export const getOrdersSeller = async (req: Request, res: Response) => {
    const { id } = req.user;

    const parsed = getOrdersSchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { status, page, limit } = parsed.data;

    try {
        const orders = await prisma.order.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                productTransaction: { sellerId: id }
            },
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', orders)
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error fetching orders')
    }
}



export const acceptOrder = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { orderId } = req.params;

    try {
        // ── Atomic assignment: only update if riderId is still null ──
        const result = await prisma.order.updateMany({
            where: {
                id: Number(orderId),
                status: OrderStatus.PAID as any,
                riderId: null,
            },
            data: {
                status: OrderStatus.ACCEPTED as any,
                riderId: id,
                assignedAt: new Date(),
            }
        });

        if (result.count === 0) {
            // Either order doesn't exist, isn't paid, or already assigned
            const existing = await prisma.order.findUnique({ where: { id: Number(orderId) } });
            if (!existing) return handleResponse(res, 404, false, 'Order not found');
            if (existing.riderId) return handleResponse(res, 409, false, 'Order already assigned to another rider');
            return handleResponse(res, 400, false, 'Order is not available for acceptance');
        }

        const updatedOrder = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                dropoffLocation: true,
                productTransaction: {
                    include: {
                        product: { include: { pickupLocation: true } },
                        seller: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
                        buyer: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
                    }
                }
            }
        });

        const riderUser = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        const riderName = `${riderUser?.profile?.firstName || ''} ${riderUser?.profile?.lastName || ''}`.trim();

        await prisma.activity.create({
            data: {
                userId: id,
                action: `${riderName} has accepted Order #${orderId}`,
                type: 'Order accepted',
                status: 'success' as any
            }
        });

        // Notify buyer
        if (updatedOrder?.productTransaction?.buyerId) {
            await NotificationService.create({
                userId: updatedOrder.productTransaction.buyerId,
                type: NotificationType.ORDER,
                title: 'Rider Assigned',
                message: `${riderName} has been assigned to deliver your order #${orderId}`,
                data: { orderId: Number(orderId) },
            });
        }

        // Notify vendor
        if (updatedOrder?.productTransaction?.sellerId) {
            await NotificationService.create({
                userId: updatedOrder.productTransaction.sellerId,
                type: NotificationType.ORDER,
                title: 'Rider Assigned',
                message: `A rider has been assigned to pick up order #${orderId}`,
                data: { orderId: Number(orderId) },
            });
        }

        // Notify other riders that this request is closed
        notifyRidersRequestClosed(Number(orderId), id);

        // Emit real-time to buyer & vendor
        const io = getIO();
        for (const uid of [updatedOrder?.productTransaction?.buyerId, updatedOrder?.productTransaction?.sellerId].filter(Boolean)) {
            const onlineUser = await prisma.onlineUser.findFirst({ where: { userId: uid! } });
            if (onlineUser?.isOnline) {
                io.to(onlineUser.socketId).emit(Emit.DELIVERY_ASSIGNED, {
                    text: `Rider ${riderName} assigned to order #${orderId}`,
                    data: updatedOrder,
                });
            }
        }

        return successResponse(res, 'success', updatedOrder);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error accepting order');
    }
};

// ─────────────── Generic rider status transition helper ───────────────
const riderStatusTransition = async (
    req: Request, res: Response,
    fromStatus: string, toStatus: string,
    activityType: string, notifyBuyerTitle: string, notifyBuyerMsg: (orderId: number) => string
) => {
    const { id } = req.user;
    const { orderId } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                rider: { include: { profile: true } },
                productTransaction: { select: { buyerId: true, sellerId: true } }
            }
        });

        if (!order) return handleResponse(res, 404, false, 'Order not found');
        if (order.riderId !== id) return handleResponse(res, 403, false, 'Not your order');
        if ((order.status as string) !== fromStatus) {
            return handleResponse(res, 400, false, `Order must be in "${fromStatus}" status`);
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: toStatus as any }
        });

        const riderName = `${order.rider?.profile?.firstName || ''} ${order.rider?.profile?.lastName || ''}`.trim();

        await prisma.activity.create({
            data: {
                userId: id,
                action: `${riderName} — Order #${order.id} → ${toStatus}`,
                type: activityType,
                status: 'success' as any
            }
        });

        // Notify buyer
        if (order.productTransaction?.buyerId) {
            await NotificationService.create({
                userId: order.productTransaction.buyerId,
                type: NotificationType.ORDER,
                title: notifyBuyerTitle,
                message: notifyBuyerMsg(order.id),
                data: { orderId: order.id, status: toStatus },
            });
        }

        // Real-time socket to buyer & seller
        const io = getIO();
        for (const uid of [order.productTransaction?.buyerId, order.productTransaction?.sellerId].filter(Boolean)) {
            const onlineUser = await prisma.onlineUser.findFirst({ where: { userId: uid! } });
            if (onlineUser?.isOnline) {
                io.to(onlineUser.socketId).emit(Emit.DELIVERY_STATUS_UPDATE, {
                    text: `Order #${order.id} status: ${toStatus}`,
                    data: updatedOrder,
                });
            }
        }

        return successResponse(res, 'success', updatedOrder);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', `Error updating order to ${toStatus}`);
    }
};

// ── Rider: en_route_to_pickup (accepted → en_route_to_pickup) ──
export const enRouteToPickup = async (req: Request, res: Response) => {
    return riderStatusTransition(
        req, res,
        OrderStatus.ACCEPTED, OrderStatus.EN_ROUTE_TO_PICKUP,
        'En route to pickup',
        'Rider En Route',
        (id) => `Your rider is on the way to pick up order #${id}`
    );
};

// ── Rider: arrived_at_pickup (en_route_to_pickup → arrived_at_pickup) ──
export const arrivedAtPickup = async (req: Request, res: Response) => {
    return riderStatusTransition(
        req, res,
        OrderStatus.EN_ROUTE_TO_PICKUP, OrderStatus.ARRIVED_AT_PICKUP,
        'Arrived at pickup',
        'Rider at Pickup',
        (id) => `Your rider has arrived at the pickup location for order #${id}`
    );
};

// ── Rider: picked_up (arrived_at_pickup → picked_up) ──
export const pickupOrder = async (req: Request, res: Response) => {
    return riderStatusTransition(
        req, res,
        OrderStatus.ARRIVED_AT_PICKUP, OrderStatus.PICKED_UP,
        'Order pickup',
        'Order Picked Up',
        (id) => `Your order #${id} has been picked up by the rider`
    );
};

// ── Vendor: confirm_pickup → in_transit (seller confirms rider picked up) ──
export const confirmPickup = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { orderId } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                productTransaction: {
                    include: { buyer: { include: { profile: true } } }
                }
            }
        });

        if (!order) return handleResponse(res, 404, false, 'Order not found');
        if ((order.status as string) !== OrderStatus.PICKED_UP) {
            return handleResponse(res, 400, false, 'Order not picked up');
        }
        if (order.productTransaction.sellerId !== id) {
            return handleResponse(res, 403, false, 'You are not authorized to confirm this order');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.IN_TRANSIT as any }
        });

        await prisma.activity.create({
            data: {
                userId: id,
                action: `Vendor confirmed pickup for Order #${order.id}`,
                type: 'Order pickup confirmation',
                status: 'success' as any
            }
        });

        // Notify buyer
        await NotificationService.create({
            userId: order.productTransaction.buyerId,
            type: NotificationType.ORDER,
            title: 'Order In Transit',
            message: `Your order #${order.id} is now in transit`,
            data: { orderId: order.id },
        });

        return successResponse(res, 'success', updatedOrder);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error confirming pickup');
    }
};

// ── Rider: arrived_at_dropoff (in_transit → arrived_at_dropoff) ──
export const arrivedAtDropoff = async (req: Request, res: Response) => {
    return riderStatusTransition(
        req, res,
        OrderStatus.IN_TRANSIT, OrderStatus.ARRIVED_AT_DROPOFF,
        'Arrived at dropoff',
        'Rider at Dropoff',
        (id) => `Your rider has arrived at the delivery location for order #${id}`
    );
};

// ── Rider: delivered (arrived_at_dropoff → delivered) ──
export const deliverOrder = async (req: Request, res: Response) => {
    return riderStatusTransition(
        req, res,
        OrderStatus.ARRIVED_AT_DROPOFF, OrderStatus.DELIVERED,
        'Order delivery',
        'Order Delivered',
        (id) => `Your order #${id} has been delivered. Please confirm delivery.`
    );
};

// ── Keep transportOrder for backward compat but unused ──
export const transportOrder = async (req: Request, res: Response) => {
    return handleResponse(res, 400, false, 'Use the new status progression endpoints instead');
};


export const confirmDelivery = async (req: Request, res: Response) => {
    const { id } = req.user;

    const { productTransactionId } = req.params;

    try {
        const productTransaction = await prisma.productTransaction.findUnique({
            where: { id: Number(productTransactionId) },
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true, wallet: true } },
                order: true,
            }
        });

        if (!productTransaction) {
            return handleResponse(res, 404, false, 'Product transaction not found')
        }

        if (productTransaction.buyerId !== id) {
            return handleResponse(res, 400, false, 'You are not authorized to confirm this order')
        }

        if (productTransaction.order && (productTransaction.order.status as any) !== OrderStatus.DELIVERED) {
            return handleResponse(res, 400, false, 'Order not delivered')
        }

        let amount = Number(productTransaction.price);
        let commission = await CommissionService.calculateCommission(amount, CommissionScope.PRODUCT);
        amount = amount - commission

        // Credit seller wallet
        if (productTransaction.seller.wallet) {
            await prisma.wallet.update({
                where: { id: productTransaction.seller.wallet.id },
                data: {
                    previousBalance: productTransaction.seller.wallet.currentBalance,
                    currentBalance: Number(productTransaction.seller.wallet.currentBalance) + amount,
                }
            });
        }

        await prisma.productTransaction.update({
            where: { id: productTransaction.id },
            data: { status: ProductTransactionStatus.DELIVERED as any }
        });

        const productCashTransaction = await prisma.transaction.create({
            data: {
                userId: productTransaction.seller.id,
                amount: amount,
                reference: randomId(12),
                status: TransactionStatus.SUCCESS as any,
                currency: 'NGN',
                timestamp: new Date(),
                description: 'product sale',
                jobId: null,
                productTransactionId: productTransaction.id,
                type: TransactionType.CREDIT as any,
            }
        })

        await LedgerService.createEntry([
            {
                transactionId: productCashTransaction.id,
                userId: productCashTransaction.userId,
                amount: Number(productCashTransaction.amount) + commission,
                type: TransactionType.DEBIT,
                account: Accounts.PLATFORM_ESCROW,
                category: EntryCategory.PRODUCT
            },
            {
                transactionId: productCashTransaction.id,
                userId: productCashTransaction.userId,
                amount: productCashTransaction.amount,
                type: TransactionType.CREDIT,
                account: Accounts.PROFESSIONAL_WALLET,
                category: EntryCategory.PRODUCT
            },
            {
                transactionId: productCashTransaction.id,
                userId: null,
                amount: commission,
                type: TransactionType.CREDIT,
                account: Accounts.PLATFORM_REVENUE,
                category: EntryCategory.PRODUCT
            }
        ])

        if (productTransaction.orderMethod === OrderMethod.DELIVERY && productTransaction.order) {
            await prisma.order.update({
                where: { id: productTransaction.order.id },
                data: { status: OrderStatus.CONFIRM_DELIVERY as any }
            });

            const rider = await prisma.user.findUnique({
                where: { id: productTransaction.order.riderId! },
                include: { wallet: true }
            })

            if (!rider) {
                throw new Error('Rider not found')
            }

            amount = Number(productTransaction.order.cost);
            commission = await CommissionService.calculateCommission(amount, CommissionScope.DELIVERY);
            amount = amount - commission

            if (rider.wallet) {
                await prisma.wallet.update({
                    where: { id: rider.wallet.id },
                    data: {
                        previousBalance: rider.wallet.currentBalance,
                        currentBalance: Number(rider.wallet.currentBalance) + amount,
                    }
                });
            }

            const orderTransaction = await prisma.transaction.create({
                data: {
                    userId: rider.id,
                    amount: amount,
                    reference: randomId(12),
                    status: TransactionStatus.SUCCESS as any,
                    currency: 'NGN',
                    timestamp: new Date(),
                    description: 'wallet deposit',
                    jobId: null,
                    productTransactionId: productTransaction.order.productTransactionId,
                    type: TransactionType.CREDIT as any,
                }
            })

            await LedgerService.createEntry([
                {
                    transactionId: orderTransaction.id,
                    userId: orderTransaction.userId,
                    amount: Number(orderTransaction.amount) + commission,
                    type: TransactionType.DEBIT,
                    account: Accounts.PLATFORM_ESCROW,
                    category: EntryCategory.DELIVERY
                },
                {
                    transactionId: orderTransaction.id,
                    userId: orderTransaction.userId,
                    amount: orderTransaction.amount,
                    type: TransactionType.CREDIT,
                    account: Accounts.PROFESSIONAL_WALLET,
                    category: EntryCategory.DELIVERY
                },
                {
                    transactionId: orderTransaction.id,
                    userId: null,
                    amount: commission,
                    type: TransactionType.CREDIT,
                    account: Accounts.PLATFORM_REVENUE,
                    category: EntryCategory.DELIVERY
                }
            ])
        }

        await prisma.activity.create({
            data: {
                userId: productTransaction.buyerId,
                action: `${productTransaction.buyer.profile?.firstName} ${productTransaction.buyer.profile?.lastName} has confirmed delivery of Order #${productTransaction.order?.id}`,
                type: 'Order confirmation',
                status: 'success' as any
            }
        })

        return successResponse(res, 'success', 'Order confirmed successfully');
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error confirming delivery');
    }
}


export const cancelOrder = async (req: Request, res: Response) => {
    const { id } = req.user;

    const { orderId } = req.params;

    try {
        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });

        if (!order) {
            return handleResponse(res, 404, false, 'Order not found')
        }

        if ((order.status as any) !== OrderStatus.PENDING) {
            return handleResponse(res, 400, false, 'Order not pending')
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED as any }
        });

        return successResponse(res, 'success', updatedOrder);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error cancelling order');
    }
}


export const disputeOrder = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = disputeSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: 'Validation error',
            errors: result.error.flatten()
        });
    }

    const { reason, description, url, productTransactionId, partnerId } = result.data

    if (!productTransactionId) {
        return res.status(400).json({
            message: 'You must provide a productTransactionId to dispute an order'
        });
    }

    const productTransaction = await prisma.productTransaction.findUnique({
        where: { id: productTransactionId },
        include: { order: true, product: true }
    });

    if (!productTransaction) {
        return res.status(404).json({
            message: 'Product transaction not found'
        });
    }

    if (productTransaction.buyerId !== id) {
        return res.status(403).json({
            message: 'You are not authorized to dispute this order'
        });
    }

    if (productTransaction.order && (productTransaction.order.status as any) !== OrderStatus.DELIVERED) {
        return res.status(400).json({
            message: 'You can only dispute an order that has been delivered'
        });
    }

    const partner = await prisma.user.findUnique({
        where: { id: partnerId || productTransaction.sellerId },
        include: { profile: true }
    });
    const reporter = await prisma.user.findUnique({
        where: { id },
        include: { profile: true }
    });

    if (!partner) {
        return res.status(404).json({
            message: 'Partner not found'
        });
    }

    await prisma.productTransaction.update({
        where: { id: productTransaction.id },
        data: { status: ProductTransactionStatus.DISPUTED as any }
    });

    if (productTransaction.order) {
        await prisma.order.update({
            where: { id: productTransaction.order.id },
            data: { status: OrderStatus.DISPUTED as any }
        });
    }

    const dispute = await prisma.dispute.create({
        data: {
            reason,
            description,
            url,
            productTransactionId: productTransaction.id,
            reporterId: id,
            partnerId: partnerId || productTransaction.sellerId,
        }
    })

    await prisma.activity.create({
        data: {
            userId: id,
            action: `${reporter?.profile?.firstName} has raised a dispute for product transaction #${productTransaction.id}`,
            type: 'Product Transaction dispute',
            status: 'pending' as any
        }
    });

    const emailMsg = disputedOrderEmail(productTransaction, dispute);

    await sendEmail(
        partner?.email,
        emailMsg.title,
        emailMsg.body,
        partner?.profile?.firstName || 'User'
    )

    return successResponse(res, 'success', dispute);
}

export const resolveDispute = async (req: Request, res: Response) => {
    const { id } = req.user;

    const { disputeId } = req.params

    const dispute = await prisma.dispute.findUnique({
        where: { id: Number(disputeId) },
        include: {
            reporter: true,
            partner: true,
        }
    })

    if (!dispute) {
        return handleResponse(res, 400, false, "Dispute not found")
    }

    const updatedDispute = await prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'RESOLVED' as any }
    });

    await prisma.activity.create({
        data: {
            userId: id,
            action: `Dispute #${dispute.id} has been resolved by admin`,
            type: 'Dispute resolution',
            status: 'success' as any
        }
    });

    const emailMsg = resolveDisputeEmail(dispute);

    await sendEmail(
        dispute.reporter!.email,
        emailMsg.title,
        emailMsg.body,
        'User'
    );

    await sendEmail(
        dispute.partner!.email,
        emailMsg.title,
        emailMsg.body,
        'User'
    );

    return successResponse(res, 'success', updatedDispute);
}


// ─────────────── EXPIRE STALE ORDERS (cron / admin endpoint) ───────────────
export const expireStaleOrders = async (_req: Request, res: Response) => {
    try {
        const now = new Date();

        const staleOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PAID as any,
                riderId: null,
                expiresAt: { lte: now },
            },
            include: {
                productTransaction: { select: { buyerId: true, sellerId: true } }
            }
        });

        if (staleOrders.length === 0) {
            return successResponse(res, 'success', { expired: 0 });
        }

        await prisma.order.updateMany({
            where: {
                id: { in: staleOrders.map(o => o.id) },
                status: OrderStatus.PAID as any,
                riderId: null,
            },
            data: { status: OrderStatus.EXPIRED as any }
        });

        // Notify buyers
        for (const order of staleOrders) {
            if (order.productTransaction?.buyerId) {
                await NotificationService.create({
                    userId: order.productTransaction.buyerId,
                    type: NotificationType.ORDER,
                    title: 'Delivery Expired',
                    message: `No rider accepted delivery for order #${order.id}. You can retry or choose self-pickup.`,
                    data: { orderId: order.id },
                });
            }
        }

        return successResponse(res, 'success', { expired: staleOrders.length });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error expiring stale orders');
    }
};


// ─────────────── RETRY RIDER SEARCH (re-open expired order) ───────────────
export const retryRiderSearch = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { orderId } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                productTransaction: {
                    include: {
                        product: { include: { pickupLocation: true } },
                        buyer: { select: { id: true } },
                    }
                },
                dropoffLocation: true,
            }
        });

        if (!order) return handleResponse(res, 404, false, 'Order not found');

        if (order.productTransaction.buyerId !== id) {
            return handleResponse(res, 403, false, 'Not your order');
        }

        if ((order.status as string) !== OrderStatus.EXPIRED) {
            return handleResponse(res, 400, false, 'Order is not expired');
        }

        const newExpiry = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: OrderStatus.PAID as any,
                expiresAt: newExpiry,
                riderId: null,
            }
        });

        // Re-notify nearby riders
        const pickup = order.productTransaction.product.pickupLocation;
        if (pickup?.latitude && pickup?.longitude && order.dropoffLocation) {
            await notifyNearbyRiders(
                updatedOrder,
                Number(pickup.latitude), Number(pickup.longitude),
                Number(order.dropoffLocation.latitude), Number(order.dropoffLocation.longitude)
            );
        }

        return successResponse(res, 'success', updatedOrder);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error retrying rider search');
    }
};


// ─────────────── GET ORDER BY ID ───────────────
export const getOrderById = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                dropoffLocation: true,
                rider: { include: { profile: true } },
                productTransaction: {
                    include: {
                        product: { include: { pickupLocation: true } },
                        seller: { select: { id: true, email: true, profile: { select: { id: true, avatar: true, firstName: true, lastName: true } } } },
                        buyer: { select: { id: true, email: true, profile: { select: { id: true, avatar: true, firstName: true, lastName: true } } } },
                    }
                }
            }
        });

        if (!order) return handleResponse(res, 404, false, 'Order not found');

        return successResponse(res, 'success', order);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error fetching order');
    }
};
