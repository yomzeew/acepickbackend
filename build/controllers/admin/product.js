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
exports.deliveryOversight = exports.marketOversight = exports.rejectProducts = exports.approveProducts = exports.getProducts = void 0;
const query_1 = require("../../validation/query");
const modules_1 = require("../../utils/modules");
const prisma_1 = __importDefault(require("../../config/prisma"));
const notification_1 = require("../../services/notification");
const messages_1 = require("../../utils/messages");
const gmail_1 = require("../../services/gmail");
const enum_1 = require("../../utils/enum");
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = query_1.getProductSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { approved, categoryId, category, search, state, lga, locationId, page, limit, orderBy, orderDir } = result.data;
    try {
        const where = {};
        if (approved !== undefined)
            where.approved = approved;
        if (categoryId)
            where.categoryId = categoryId;
        if (search)
            where.name = { contains: search };
        if (locationId)
            where.locationId = locationId;
        const categoryWhere = {};
        if (category)
            categoryWhere.name = { contains: category };
        const locationWhere = {};
        if (state)
            locationWhere.state = { contains: state };
        if (lga)
            locationWhere.lga = { contains: lga };
        const [products, count] = yield Promise.all([
            prisma_1.default.product.findMany({
                where: Object.assign(Object.assign({}, where), { category: Object.keys(categoryWhere).length ? categoryWhere : undefined, pickupLocation: Object.keys(locationWhere).length ? locationWhere : undefined }),
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    category: { select: { id: true, name: true, description: true } },
                    pickupLocation: true,
                },
                orderBy: { [orderBy || 'createdAt']: (orderDir || 'desc').toLowerCase() }
            }),
            prisma_1.default.product.count({
                where: Object.assign(Object.assign({}, where), { category: Object.keys(categoryWhere).length ? categoryWhere : undefined, pickupLocation: Object.keys(locationWhere).length ? locationWhere : undefined })
            })
        ]);
        return (0, modules_1.successResponse)(res, 'success', {
            products: products.map((product) => (Object.assign(Object.assign({}, product), { images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images }))),
            page,
            limit,
            total: count
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve products');
    }
});
exports.getProducts = getProducts;
const approveProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { id: Number(req.params.productId) },
            include: { user: { include: { profile: true } } }
        });
        if (!product) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Product not found');
        }
        if (product.approved) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Product already approved');
        }
        yield prisma_1.default.product.update({ where: { id: product.id }, data: { approved: true } });
        const prod = product;
        const email = (0, messages_1.approveProductEmail)(prod);
        const { success } = yield (0, gmail_1.sendEmail)(prod.user.email, email.title, email.body, (_a = prod.user.profile) === null || _a === void 0 ? void 0 : _a.firstName);
        yield notification_1.NotificationService.create({
            userId: prod.userId,
            type: enum_1.NotificationType.SYSTEM,
            title: 'Product Approved',
            message: `Your product "${prod.name}" has been approved by admin`,
            data: { productId: prod.id },
        });
        return (0, modules_1.successResponse)(res, 'success', { message: 'Product approved successfully', emailSentStatus: success });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to approve product');
    }
});
exports.approveProducts = approveProducts;
const rejectProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { id: Number(req.params.productId) },
            include: { user: { include: { profile: true } } }
        });
        if (!product) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Product not found');
        }
        if (product.approved === false) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Product already rejected');
        }
        yield prisma_1.default.product.update({ where: { id: product.id }, data: { approved: false } });
        const prod = product;
        const email = (0, messages_1.rejectProductEmail)(prod);
        const { success } = yield (0, gmail_1.sendEmail)(prod.user.email, email.title, email.body, (_a = prod.user.profile) === null || _a === void 0 ? void 0 : _a.firstName);
        yield notification_1.NotificationService.create({
            userId: prod.userId,
            type: enum_1.NotificationType.SYSTEM,
            title: 'Product Rejected',
            message: `Your product "${prod.name}" has been rejected by admin`,
            data: { productId: prod.id },
        });
        return (0, modules_1.successResponse)(res, 'success', { message: 'Product rejected successfully', emailSentStatus: success });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to reject product');
    }
});
exports.rejectProducts = rejectProducts;
const marketOversight = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalProducts = yield prisma_1.default.product.count();
        const pendingProducts = yield prisma_1.default.product.count({ where: { approved: null } });
        const approvedProducts = yield prisma_1.default.product.count({ where: { approved: true } });
        const rejectedProducts = yield prisma_1.default.product.count({ where: { approved: false } });
        const totalTransactions = yield prisma_1.default.transaction.count({ where: { status: enum_1.TransactionStatus.SUCCESS } });
        const disputedProducts = yield prisma_1.default.productTransaction.count({ where: { status: enum_1.ProductTransactionStatus.DISPUTED } });
        return (0, modules_1.successResponse)(res, 'success', {
            totalProducts,
            approvedProducts,
            rejectedProducts,
            pendingProducts,
            totalTransactions
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal Server Error');
    }
});
exports.marketOversight = marketOversight;
const deliveryOversight = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalDeliveries = yield prisma_1.default.order.count();
        const unassignedDeliveries = yield prisma_1.default.order.count({ where: { status: enum_1.OrderStatus.PAID } });
        const assignedDeliveries = yield prisma_1.default.order.count({ where: { status: enum_1.OrderStatus.ACCEPTED } });
        const pickedUpDevliveries = yield prisma_1.default.order.count({ where: { status: enum_1.OrderStatus.CONFIRM_PICKUP } });
        const completedDeliveries = yield prisma_1.default.order.count({ where: { status: enum_1.OrderStatus.CONFIRM_DELIVERY } });
        const disputedDeliveries = yield prisma_1.default.order.count({ where: { status: enum_1.OrderStatus.DISPUTED } });
        return (0, modules_1.successResponse)(res, 'success', {
            totalDeliveries,
            unassignedDeliveries,
            assignedDeliveries,
            pickedUpDevliveries,
            completedDeliveries,
            disputedDeliveries
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal Server Error');
    }
});
exports.deliveryOversight = deliveryOversight;
