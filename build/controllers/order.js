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
exports.getOrderById = exports.retryRiderSearch = exports.expireStaleOrders = exports.resolveDispute = exports.disputeOrder = exports.cancelOrder = exports.confirmDelivery = exports.transportOrder = exports.deliverOrder = exports.arrivedAtDropoff = exports.confirmPickup = exports.pickupOrder = exports.arrivedAtPickup = exports.enRouteToPickup = exports.acceptOrder = exports.getOrdersSeller = exports.getOrdersBuyer = exports.getOrdersRider = exports.getNearestPaidOrders = exports.createOrder = exports.notifyNearbyRiders = void 0;
const body_1 = require("../validation/body");
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
const modules_1 = require("../utils/modules");
const query_1 = require("../validation/query");
const CommissionService_1 = require("../services/CommissionService");
const ledgerService_1 = require("../services/ledgerService");
const messages_1 = require("../utils/messages");
const gmail_1 = require("../services/gmail");
const notification_1 = require("../services/notification");
const chat_1 = require("../chat");
const events_1 = require("../utils/events");
const ORDER_EXPIRY_MINUTES = 15;
// ─────────────── Helper: notify nearby riders via push + socket ───────────────
const notifyNearbyRiders = (order, pickupLat, pickupLong, dropoffLat, dropoffLong) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const riders = yield prisma_1.default.rider.findMany({
            where: { status: enum_1.RiderStatus.AVAILABLE },
            include: { user: { include: { location: true, profile: true } } }
        });
        const io = (0, chat_1.getIO)();
        const eligibleRiderUserIds = [];
        for (const rider of riders) {
            const loc = rider.user.location[0];
            if (!(loc === null || loc === void 0 ? void 0 : loc.latitude) || !(loc === null || loc === void 0 ? void 0 : loc.longitude))
                continue;
            const dist = (0, modules_1.getDistanceFromLatLonInKm)(loc.latitude, loc.longitude, pickupLat, pickupLong);
            if (dist > 50)
                continue; // within 50km radius
            eligibleRiderUserIds.push(rider.userId);
            // Real-time socket notification
            const onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: rider.userId } });
            if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
                io.to(onlineUser.socketId).emit(events_1.Emit.NEW_DELIVERY_REQUEST, {
                    text: 'New delivery request available',
                    data: order,
                });
            }
        }
        // Bulk push notification
        if (eligibleRiderUserIds.length > 0) {
            yield notification_1.NotificationService.createBulk(eligibleRiderUserIds, enum_1.NotificationType.ORDER, 'New Delivery Request', `Delivery #${order.id} — ₦${Number(order.cost).toLocaleString()} fee. Tap to accept.`, { orderId: order.id });
        }
        return eligibleRiderUserIds.length;
    }
    catch (err) {
        console.error('notifyNearbyRiders error:', err);
        return 0;
    }
});
exports.notifyNearbyRiders = notifyNearbyRiders;
// ─────────────── Helper: notify other riders that request is closed ───────────────
const notifyRidersRequestClosed = (orderId, assignedRiderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const io = (0, chat_1.getIO)();
        // Find all riders who got the original notification (online + available)
        const riders = yield prisma_1.default.rider.findMany({
            where: { status: enum_1.RiderStatus.AVAILABLE, userId: { not: assignedRiderId } },
            include: { user: true }
        });
        for (const rider of riders) {
            const onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: rider.userId } });
            if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
                io.to(onlineUser.socketId).emit(events_1.Emit.DELIVERY_REQUEST_CLOSED, {
                    text: 'Delivery request has been assigned to another rider',
                    data: { orderId },
                });
            }
        }
    }
    catch (err) {
        console.error('notifyRidersRequestClosed error:', err);
    }
});
// ─────────────── CREATE ORDER (delivery) ───────────────
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id } = req.user;
    try {
        const parsed = body_1.deliverySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const { productTransactionId, receiverLat, receiverLong, address, locationId, vehicleType } = parsed.data;
        const productTransaction = yield prisma_1.default.productTransaction.findFirst({
            where: { id: productTransactionId, buyerId: id },
            include: {
                product: { include: { pickupLocation: true } },
                buyer: { include: { profile: true } }
            }
        });
        if (!productTransaction) {
            return res.status(400).json({ errors: 'Product transaction not found' });
        }
        if (productTransaction.orderMethod !== enum_1.OrderMethod.DELIVERY) {
            return res.status(400).json({ errors: 'Product transaction not meant for delivery' });
        }
        let existingLocation = null;
        if (locationId) {
            existingLocation = yield prisma_1.default.location.findFirst({
                where: { id: locationId, userId: id }
            });
        }
        else {
            existingLocation = yield prisma_1.default.location.create({
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
        const clientLat = existingLocation === null || existingLocation === void 0 ? void 0 : existingLocation.latitude;
        const clientLong = existingLocation === null || existingLocation === void 0 ? void 0 : existingLocation.longitude;
        const distance = (0, modules_1.getDistanceFromLatLonInKm)(vendorLat, vendorLong, clientLat, clientLong);
        const pricing = yield prisma_1.default.deliveryPricing.findFirst({
            where: { vehicleType: vehicleType }
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
        const order = yield prisma_1.default.order.create({
            data: {
                productTransactionId,
                cost: totalCost,
                distance,
                weight: totalWeight,
                deliveryFee: totalCost,
                locationId: existingLocation.id,
                pickupAddress: ((_a = productTransaction.product.pickupLocation) === null || _a === void 0 ? void 0 : _a.address) || null,
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
        yield prisma_1.default.activity.create({
            data: {
                userId: id,
                action: `${(_b = productTransaction.buyer.profile) === null || _b === void 0 ? void 0 : _b.firstName} ${(_c = productTransaction.buyer.profile) === null || _c === void 0 ? void 0 : _c.lastName} has created Order #${order.id}`,
                type: 'Order created',
                status: 'success'
            }
        });
        // Notify vendor
        yield notification_1.NotificationService.create({
            userId: productTransaction.sellerId,
            type: enum_1.NotificationType.ORDER,
            title: 'New Order',
            message: `${(_d = productTransaction.buyer.profile) === null || _d === void 0 ? void 0 : _d.firstName} ordered ${productTransaction.quantity}x ${productTransaction.product.name}. Delivery requested.`,
            data: { orderId: order.id, productTransactionId },
        });
        return (0, modules_1.successResponse)(res, 'success', Object.assign(Object.assign({}, order), { totalCost: Number(order.cost) + Number(productTransaction.price) }));
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error creating order');
    }
});
exports.createOrder = createOrder;
const getNearestPaidOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.user;
    try {
        const rider = yield prisma_1.default.rider.findFirst({
            where: { userId: id },
            include: { user: { include: { location: true } } }
        });
        if (!rider) {
            return (0, modules_1.handleResponse)(res, 404, false, 'You are not a rider');
        }
        const riderLat = (_a = rider.user.location[0]) === null || _a === void 0 ? void 0 : _a.latitude;
        const riderLong = (_b = rider.user.location[0]) === null || _b === void 0 ? void 0 : _b.longitude;
        if (!riderLat || !riderLong) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Please update your location');
        }
        const orders = yield prisma_1.default.order.findMany({
            where: {
                riderId: null,
                status: enum_1.OrderStatus.PAID,
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
        const ordersWithDistance = orders.map((order) => {
            var _a, _b;
            const pickup = (_b = (_a = order.productTransaction) === null || _a === void 0 ? void 0 : _a.product) === null || _b === void 0 ? void 0 : _b.pickupLocation;
            if (pickup && pickup.latitude && pickup.longitude) {
                const distance = (0, modules_1.getDistanceFromLatLonInKm)(riderLat, riderLong, pickup.latitude, pickup.longitude);
                return Object.assign(Object.assign({}, order), { distance });
            }
            return Object.assign(Object.assign({}, order), { distance: null });
        });
        ordersWithDistance.sort((a, b) => a.distance - b.distance);
        return (0, modules_1.successResponse)(res, 'success', ordersWithDistance);
    }
    catch (error) {
        console.error('Error in getNearestPaidOrders:', error);
        return (0, modules_1.errorResponse)(res, 'error', error instanceof Error ? error.message : 'Error fetching orders');
    }
});
exports.getNearestPaidOrders = getNearestPaidOrders;
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
const getOrdersRider = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const parsed = query_1.getOrdersSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { status, page, limit } = parsed.data;
    try {
        const orders = yield prisma_1.default.order.findMany({
            where: Object.assign({ riderId: id }, ((status && status !== 'all') ? { status: status } : {})),
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', orders);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching orders');
    }
});
exports.getOrdersRider = getOrdersRider;
const getOrdersBuyer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const parsed = query_1.getOrdersSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { status, page, limit } = parsed.data;
    try {
        const orders = yield prisma_1.default.order.findMany({
            where: Object.assign(Object.assign({}, (status ? { status: status } : {})), { productTransaction: { buyerId: id } }),
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', orders);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching orders');
    }
});
exports.getOrdersBuyer = getOrdersBuyer;
const getOrdersSeller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const parsed = query_1.getOrdersSchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { status, page, limit } = parsed.data;
    try {
        const orders = yield prisma_1.default.order.findMany({
            where: Object.assign(Object.assign({}, (status ? { status: status } : {})), { productTransaction: { sellerId: id } }),
            include: {
                dropoffLocation: true,
                productTransaction: orderProductTransactionInclude,
            },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', orders);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching orders');
    }
});
exports.getOrdersSeller = getOrdersSeller;
const acceptOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { id } = req.user;
    const { orderId } = req.params;
    try {
        // ── Atomic assignment: only update if riderId is still null ──
        const result = yield prisma_1.default.order.updateMany({
            where: {
                id: Number(orderId),
                status: enum_1.OrderStatus.PAID,
                riderId: null,
            },
            data: {
                status: enum_1.OrderStatus.ACCEPTED,
                riderId: id,
                assignedAt: new Date(),
            }
        });
        if (result.count === 0) {
            // Either order doesn't exist, isn't paid, or already assigned
            const existing = yield prisma_1.default.order.findUnique({ where: { id: Number(orderId) } });
            if (!existing)
                return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
            if (existing.riderId)
                return (0, modules_1.handleResponse)(res, 409, false, 'Order already assigned to another rider');
            return (0, modules_1.handleResponse)(res, 400, false, 'Order is not available for acceptance');
        }
        const updatedOrder = yield prisma_1.default.order.findUnique({
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
        const riderUser = yield prisma_1.default.user.findUnique({
            where: { id },
            include: { profile: true }
        });
        const riderName = `${((_a = riderUser === null || riderUser === void 0 ? void 0 : riderUser.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = riderUser === null || riderUser === void 0 ? void 0 : riderUser.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        yield prisma_1.default.activity.create({
            data: {
                userId: id,
                action: `${riderName} has accepted Order #${orderId}`,
                type: 'Order accepted',
                status: 'success'
            }
        });
        // Notify buyer
        if ((_c = updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.productTransaction) === null || _c === void 0 ? void 0 : _c.buyerId) {
            yield notification_1.NotificationService.create({
                userId: updatedOrder.productTransaction.buyerId,
                type: enum_1.NotificationType.ORDER,
                title: 'Rider Assigned',
                message: `${riderName} has been assigned to deliver your order #${orderId}`,
                data: { orderId: Number(orderId) },
            });
        }
        // Notify vendor
        if ((_d = updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.productTransaction) === null || _d === void 0 ? void 0 : _d.sellerId) {
            yield notification_1.NotificationService.create({
                userId: updatedOrder.productTransaction.sellerId,
                type: enum_1.NotificationType.ORDER,
                title: 'Rider Assigned',
                message: `A rider has been assigned to pick up order #${orderId}`,
                data: { orderId: Number(orderId) },
            });
        }
        // Notify other riders that this request is closed
        notifyRidersRequestClosed(Number(orderId), id);
        // Emit real-time to buyer & vendor
        const io = (0, chat_1.getIO)();
        for (const uid of [(_e = updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.productTransaction) === null || _e === void 0 ? void 0 : _e.buyerId, (_f = updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.productTransaction) === null || _f === void 0 ? void 0 : _f.sellerId].filter(Boolean)) {
            const onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: uid } });
            if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
                io.to(onlineUser.socketId).emit(events_1.Emit.DELIVERY_ASSIGNED, {
                    text: `Rider ${riderName} assigned to order #${orderId}`,
                    data: updatedOrder,
                });
            }
        }
        return (0, modules_1.successResponse)(res, 'success', updatedOrder);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error accepting order');
    }
});
exports.acceptOrder = acceptOrder;
// ─────────────── Generic rider status transition helper ───────────────
const riderStatusTransition = (req, res, fromStatus, toStatus, activityType, notifyBuyerTitle, notifyBuyerMsg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const { id } = req.user;
    const { orderId } = req.params;
    try {
        const order = yield prisma_1.default.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                rider: { include: { profile: true } },
                productTransaction: { select: { buyerId: true, sellerId: true } }
            }
        });
        if (!order)
            return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
        if (order.riderId !== id)
            return (0, modules_1.handleResponse)(res, 403, false, 'Not your order');
        if (order.status !== fromStatus) {
            return (0, modules_1.handleResponse)(res, 400, false, `Order must be in "${fromStatus}" status`);
        }
        const updatedOrder = yield prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: toStatus }
        });
        const riderName = `${((_b = (_a = order.rider) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.firstName) || ''} ${((_d = (_c = order.rider) === null || _c === void 0 ? void 0 : _c.profile) === null || _d === void 0 ? void 0 : _d.lastName) || ''}`.trim();
        yield prisma_1.default.activity.create({
            data: {
                userId: id,
                action: `${riderName} — Order #${order.id} → ${toStatus}`,
                type: activityType,
                status: 'success'
            }
        });
        // Notify buyer
        if ((_e = order.productTransaction) === null || _e === void 0 ? void 0 : _e.buyerId) {
            yield notification_1.NotificationService.create({
                userId: order.productTransaction.buyerId,
                type: enum_1.NotificationType.ORDER,
                title: notifyBuyerTitle,
                message: notifyBuyerMsg(order.id),
                data: { orderId: order.id, status: toStatus },
            });
        }
        // Real-time socket to buyer & seller
        const io = (0, chat_1.getIO)();
        for (const uid of [(_f = order.productTransaction) === null || _f === void 0 ? void 0 : _f.buyerId, (_g = order.productTransaction) === null || _g === void 0 ? void 0 : _g.sellerId].filter(Boolean)) {
            const onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: uid } });
            if (onlineUser === null || onlineUser === void 0 ? void 0 : onlineUser.isOnline) {
                io.to(onlineUser.socketId).emit(events_1.Emit.DELIVERY_STATUS_UPDATE, {
                    text: `Order #${order.id} status: ${toStatus}`,
                    data: updatedOrder,
                });
            }
        }
        return (0, modules_1.successResponse)(res, 'success', updatedOrder);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', `Error updating order to ${toStatus}`);
    }
});
// ── Rider: en_route_to_pickup (accepted → en_route_to_pickup) ──
const enRouteToPickup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return riderStatusTransition(req, res, enum_1.OrderStatus.ACCEPTED, enum_1.OrderStatus.EN_ROUTE_TO_PICKUP, 'En route to pickup', 'Rider En Route', (id) => `Your rider is on the way to pick up order #${id}`);
});
exports.enRouteToPickup = enRouteToPickup;
// ── Rider: arrived_at_pickup (en_route_to_pickup → arrived_at_pickup) ──
const arrivedAtPickup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return riderStatusTransition(req, res, enum_1.OrderStatus.EN_ROUTE_TO_PICKUP, enum_1.OrderStatus.ARRIVED_AT_PICKUP, 'Arrived at pickup', 'Rider at Pickup', (id) => `Your rider has arrived at the pickup location for order #${id}`);
});
exports.arrivedAtPickup = arrivedAtPickup;
// ── Rider: picked_up (arrived_at_pickup → picked_up) ──
const pickupOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return riderStatusTransition(req, res, enum_1.OrderStatus.ARRIVED_AT_PICKUP, enum_1.OrderStatus.PICKED_UP, 'Order pickup', 'Order Picked Up', (id) => `Your order #${id} has been picked up by the rider`);
});
exports.pickupOrder = pickupOrder;
// ── Vendor: confirm_pickup → in_transit (seller confirms rider picked up) ──
const confirmPickup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { orderId } = req.params;
    try {
        const order = yield prisma_1.default.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                productTransaction: {
                    include: { buyer: { include: { profile: true } } }
                }
            }
        });
        if (!order)
            return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
        if (order.status !== enum_1.OrderStatus.PICKED_UP) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Order not picked up');
        }
        if (order.productTransaction.sellerId !== id) {
            return (0, modules_1.handleResponse)(res, 403, false, 'You are not authorized to confirm this order');
        }
        const updatedOrder = yield prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: enum_1.OrderStatus.IN_TRANSIT }
        });
        yield prisma_1.default.activity.create({
            data: {
                userId: id,
                action: `Vendor confirmed pickup for Order #${order.id}`,
                type: 'Order pickup confirmation',
                status: 'success'
            }
        });
        // Notify buyer
        yield notification_1.NotificationService.create({
            userId: order.productTransaction.buyerId,
            type: enum_1.NotificationType.ORDER,
            title: 'Order In Transit',
            message: `Your order #${order.id} is now in transit`,
            data: { orderId: order.id },
        });
        return (0, modules_1.successResponse)(res, 'success', updatedOrder);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error confirming pickup');
    }
});
exports.confirmPickup = confirmPickup;
// ── Rider: arrived_at_dropoff (in_transit → arrived_at_dropoff) ──
const arrivedAtDropoff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return riderStatusTransition(req, res, enum_1.OrderStatus.IN_TRANSIT, enum_1.OrderStatus.ARRIVED_AT_DROPOFF, 'Arrived at dropoff', 'Rider at Dropoff', (id) => `Your rider has arrived at the delivery location for order #${id}`);
});
exports.arrivedAtDropoff = arrivedAtDropoff;
// ── Rider: delivered (arrived_at_dropoff → delivered) ──
const deliverOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return riderStatusTransition(req, res, enum_1.OrderStatus.ARRIVED_AT_DROPOFF, enum_1.OrderStatus.DELIVERED, 'Order delivery', 'Order Delivered', (id) => `Your order #${id} has been delivered. Please confirm delivery.`);
});
exports.deliverOrder = deliverOrder;
// ── Keep transportOrder for backward compat but unused ──
const transportOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, modules_1.handleResponse)(res, 400, false, 'Use the new status progression endpoints instead');
});
exports.transportOrder = transportOrder;
const confirmDelivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.user;
    const { productTransactionId } = req.params;
    try {
        const productTransaction = yield prisma_1.default.productTransaction.findUnique({
            where: { id: Number(productTransactionId) },
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true, wallet: true } },
                order: true,
            }
        });
        if (!productTransaction) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Product transaction not found');
        }
        if (productTransaction.buyerId !== id) {
            return (0, modules_1.handleResponse)(res, 400, false, 'You are not authorized to confirm this order');
        }
        if (productTransaction.order && productTransaction.order.status !== enum_1.OrderStatus.DELIVERED) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Order not delivered');
        }
        let amount = Number(productTransaction.price);
        let commission = yield CommissionService_1.CommissionService.calculateCommission(amount, enum_1.CommissionScope.PRODUCT);
        amount = amount - commission;
        // Credit seller wallet
        if (productTransaction.seller.wallet) {
            yield prisma_1.default.wallet.update({
                where: { id: productTransaction.seller.wallet.id },
                data: {
                    previousBalance: productTransaction.seller.wallet.currentBalance,
                    currentBalance: Number(productTransaction.seller.wallet.currentBalance) + amount,
                }
            });
        }
        yield prisma_1.default.productTransaction.update({
            where: { id: productTransaction.id },
            data: { status: enum_1.ProductTransactionStatus.DELIVERED }
        });
        const productCashTransaction = yield prisma_1.default.transaction.create({
            data: {
                userId: productTransaction.seller.id,
                amount: amount,
                reference: (0, modules_1.randomId)(12),
                status: enum_1.TransactionStatus.SUCCESS,
                currency: 'NGN',
                timestamp: new Date(),
                description: 'product sale',
                jobId: null,
                productTransactionId: productTransaction.id,
                type: enum_1.TransactionType.CREDIT,
            }
        });
        yield ledgerService_1.LedgerService.createEntry([
            {
                transactionId: productCashTransaction.id,
                userId: productCashTransaction.userId,
                amount: Number(productCashTransaction.amount) + commission,
                type: enum_1.TransactionType.DEBIT,
                account: enum_1.Accounts.PLATFORM_ESCROW,
                category: enum_1.EntryCategory.PRODUCT
            },
            {
                transactionId: productCashTransaction.id,
                userId: productCashTransaction.userId,
                amount: productCashTransaction.amount,
                type: enum_1.TransactionType.CREDIT,
                account: enum_1.Accounts.PROFESSIONAL_WALLET,
                category: enum_1.EntryCategory.PRODUCT
            },
            {
                transactionId: productCashTransaction.id,
                userId: null,
                amount: commission,
                type: enum_1.TransactionType.CREDIT,
                account: enum_1.Accounts.PLATFORM_REVENUE,
                category: enum_1.EntryCategory.PRODUCT
            }
        ]);
        if (productTransaction.orderMethod === enum_1.OrderMethod.DELIVERY && productTransaction.order) {
            yield prisma_1.default.order.update({
                where: { id: productTransaction.order.id },
                data: { status: enum_1.OrderStatus.CONFIRM_DELIVERY }
            });
            const rider = yield prisma_1.default.user.findUnique({
                where: { id: productTransaction.order.riderId },
                include: { wallet: true }
            });
            if (!rider) {
                throw new Error('Rider not found');
            }
            amount = Number(productTransaction.order.cost);
            commission = yield CommissionService_1.CommissionService.calculateCommission(amount, enum_1.CommissionScope.DELIVERY);
            amount = amount - commission;
            if (rider.wallet) {
                yield prisma_1.default.wallet.update({
                    where: { id: rider.wallet.id },
                    data: {
                        previousBalance: rider.wallet.currentBalance,
                        currentBalance: Number(rider.wallet.currentBalance) + amount,
                    }
                });
            }
            const orderTransaction = yield prisma_1.default.transaction.create({
                data: {
                    userId: rider.id,
                    amount: amount,
                    reference: (0, modules_1.randomId)(12),
                    status: enum_1.TransactionStatus.SUCCESS,
                    currency: 'NGN',
                    timestamp: new Date(),
                    description: 'wallet deposit',
                    jobId: null,
                    productTransactionId: productTransaction.order.productTransactionId,
                    type: enum_1.TransactionType.CREDIT,
                }
            });
            yield ledgerService_1.LedgerService.createEntry([
                {
                    transactionId: orderTransaction.id,
                    userId: orderTransaction.userId,
                    amount: Number(orderTransaction.amount) + commission,
                    type: enum_1.TransactionType.DEBIT,
                    account: enum_1.Accounts.PLATFORM_ESCROW,
                    category: enum_1.EntryCategory.DELIVERY
                },
                {
                    transactionId: orderTransaction.id,
                    userId: orderTransaction.userId,
                    amount: orderTransaction.amount,
                    type: enum_1.TransactionType.CREDIT,
                    account: enum_1.Accounts.PROFESSIONAL_WALLET,
                    category: enum_1.EntryCategory.DELIVERY
                },
                {
                    transactionId: orderTransaction.id,
                    userId: null,
                    amount: commission,
                    type: enum_1.TransactionType.CREDIT,
                    account: enum_1.Accounts.PLATFORM_REVENUE,
                    category: enum_1.EntryCategory.DELIVERY
                }
            ]);
        }
        yield prisma_1.default.activity.create({
            data: {
                userId: productTransaction.buyerId,
                action: `${(_a = productTransaction.buyer.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = productTransaction.buyer.profile) === null || _b === void 0 ? void 0 : _b.lastName} has confirmed delivery of Order #${(_c = productTransaction.order) === null || _c === void 0 ? void 0 : _c.id}`,
                type: 'Order confirmation',
                status: 'success'
            }
        });
        return (0, modules_1.successResponse)(res, 'success', 'Order confirmed successfully');
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error confirming delivery');
    }
});
exports.confirmDelivery = confirmDelivery;
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { orderId } = req.params;
    try {
        const order = yield prisma_1.default.order.findUnique({ where: { id: Number(orderId) } });
        if (!order) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
        }
        if (order.status !== enum_1.OrderStatus.PENDING) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Order not pending');
        }
        const updatedOrder = yield prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: enum_1.OrderStatus.CANCELLED }
        });
        return (0, modules_1.successResponse)(res, 'success', updatedOrder);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error cancelling order');
    }
});
exports.cancelOrder = cancelOrder;
const disputeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.user;
    const result = body_1.disputeSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: 'Validation error',
            errors: result.error.flatten()
        });
    }
    const { reason, description, url, productTransactionId, partnerId } = result.data;
    if (!productTransactionId) {
        return res.status(400).json({
            message: 'You must provide a productTransactionId to dispute an order'
        });
    }
    const productTransaction = yield prisma_1.default.productTransaction.findUnique({
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
    if (productTransaction.order && productTransaction.order.status !== enum_1.OrderStatus.DELIVERED) {
        return res.status(400).json({
            message: 'You can only dispute an order that has been delivered'
        });
    }
    const partner = yield prisma_1.default.user.findUnique({
        where: { id: partnerId || productTransaction.sellerId },
        include: { profile: true }
    });
    const reporter = yield prisma_1.default.user.findUnique({
        where: { id },
        include: { profile: true }
    });
    if (!partner) {
        return res.status(404).json({
            message: 'Partner not found'
        });
    }
    yield prisma_1.default.productTransaction.update({
        where: { id: productTransaction.id },
        data: { status: enum_1.ProductTransactionStatus.DISPUTED }
    });
    if (productTransaction.order) {
        yield prisma_1.default.order.update({
            where: { id: productTransaction.order.id },
            data: { status: enum_1.OrderStatus.DISPUTED }
        });
    }
    const dispute = yield prisma_1.default.dispute.create({
        data: {
            reason,
            description,
            url,
            productTransactionId: productTransaction.id,
            reporterId: id,
            partnerId: partnerId || productTransaction.sellerId,
        }
    });
    yield prisma_1.default.activity.create({
        data: {
            userId: id,
            action: `${(_a = reporter === null || reporter === void 0 ? void 0 : reporter.profile) === null || _a === void 0 ? void 0 : _a.firstName} has raised a dispute for product transaction #${productTransaction.id}`,
            type: 'Product Transaction dispute',
            status: 'pending'
        }
    });
    const emailMsg = (0, messages_1.disputedOrderEmail)(productTransaction, dispute);
    yield (0, gmail_1.sendEmail)(partner === null || partner === void 0 ? void 0 : partner.email, emailMsg.title, emailMsg.body, ((_b = partner === null || partner === void 0 ? void 0 : partner.profile) === null || _b === void 0 ? void 0 : _b.firstName) || 'User');
    return (0, modules_1.successResponse)(res, 'success', dispute);
});
exports.disputeOrder = disputeOrder;
const resolveDispute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { disputeId } = req.params;
    const dispute = yield prisma_1.default.dispute.findUnique({
        where: { id: Number(disputeId) },
        include: {
            reporter: true,
            partner: true,
        }
    });
    if (!dispute) {
        return (0, modules_1.handleResponse)(res, 400, false, "Dispute not found");
    }
    const updatedDispute = yield prisma_1.default.dispute.update({
        where: { id: dispute.id },
        data: { status: 'RESOLVED' }
    });
    yield prisma_1.default.activity.create({
        data: {
            userId: id,
            action: `Dispute #${dispute.id} has been resolved by admin`,
            type: 'Dispute resolution',
            status: 'success'
        }
    });
    const emailMsg = (0, messages_1.resolveDisputeEmail)(dispute);
    yield (0, gmail_1.sendEmail)(dispute.reporter.email, emailMsg.title, emailMsg.body, 'User');
    yield (0, gmail_1.sendEmail)(dispute.partner.email, emailMsg.title, emailMsg.body, 'User');
    return (0, modules_1.successResponse)(res, 'success', updatedDispute);
});
exports.resolveDispute = resolveDispute;
// ─────────────── EXPIRE STALE ORDERS (cron / admin endpoint) ───────────────
const expireStaleOrders = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const now = new Date();
        const staleOrders = yield prisma_1.default.order.findMany({
            where: {
                status: enum_1.OrderStatus.PAID,
                riderId: null,
                expiresAt: { lte: now },
            },
            include: {
                productTransaction: { select: { buyerId: true, sellerId: true } }
            }
        });
        if (staleOrders.length === 0) {
            return (0, modules_1.successResponse)(res, 'success', { expired: 0 });
        }
        yield prisma_1.default.order.updateMany({
            where: {
                id: { in: staleOrders.map(o => o.id) },
                status: enum_1.OrderStatus.PAID,
                riderId: null,
            },
            data: { status: enum_1.OrderStatus.EXPIRED }
        });
        // Notify buyers
        for (const order of staleOrders) {
            if ((_a = order.productTransaction) === null || _a === void 0 ? void 0 : _a.buyerId) {
                yield notification_1.NotificationService.create({
                    userId: order.productTransaction.buyerId,
                    type: enum_1.NotificationType.ORDER,
                    title: 'Delivery Expired',
                    message: `No rider accepted delivery for order #${order.id}. You can retry or choose self-pickup.`,
                    data: { orderId: order.id },
                });
            }
        }
        return (0, modules_1.successResponse)(res, 'success', { expired: staleOrders.length });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error expiring stale orders');
    }
});
exports.expireStaleOrders = expireStaleOrders;
// ─────────────── RETRY RIDER SEARCH (re-open expired order) ───────────────
const retryRiderSearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { orderId } = req.params;
    try {
        const order = yield prisma_1.default.order.findUnique({
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
        if (!order)
            return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
        if (order.productTransaction.buyerId !== id) {
            return (0, modules_1.handleResponse)(res, 403, false, 'Not your order');
        }
        if (order.status !== enum_1.OrderStatus.EXPIRED) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Order is not expired');
        }
        const newExpiry = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);
        const updatedOrder = yield prisma_1.default.order.update({
            where: { id: order.id },
            data: {
                status: enum_1.OrderStatus.PAID,
                expiresAt: newExpiry,
                riderId: null,
            }
        });
        // Re-notify nearby riders
        const pickup = order.productTransaction.product.pickupLocation;
        if ((pickup === null || pickup === void 0 ? void 0 : pickup.latitude) && (pickup === null || pickup === void 0 ? void 0 : pickup.longitude) && order.dropoffLocation) {
            yield (0, exports.notifyNearbyRiders)(updatedOrder, Number(pickup.latitude), Number(pickup.longitude), Number(order.dropoffLocation.latitude), Number(order.dropoffLocation.longitude));
        }
        return (0, modules_1.successResponse)(res, 'success', updatedOrder);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error retrying rider search');
    }
});
exports.retryRiderSearch = retryRiderSearch;
// ─────────────── GET ORDER BY ID ───────────────
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    try {
        const order = yield prisma_1.default.order.findUnique({
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
        if (!order)
            return (0, modules_1.handleResponse)(res, 404, false, 'Order not found');
        return (0, modules_1.successResponse)(res, 'success', order);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching order');
    }
});
exports.getOrderById = getOrderById;
