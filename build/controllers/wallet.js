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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditWallet = exports.forgotPin = exports.resetPin = exports.setPin = exports.debitWalletForProductOrder = exports.debitWallet = exports.viewWallet = exports.createWallet = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const enum_1 = require("../utils/enum");
const body_1 = require("../validation/body");
const messages_1 = require("../utils/messages");
const gmail_1 = require("../services/gmail");
const notification_1 = require("../services/notification");
const enum_2 = require("../utils/enum");
const zod_1 = __importDefault(require("zod"));
const ledgerService_1 = require("../services/ledgerService");
const order_1 = require("./order");
const createWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { currency = 'NGN' } = req.body;
    try {
        const wallet = yield prisma_1.default.wallet.create({
            data: {
                userId: id,
                currency: currency,
                currentBalance: 0,
                previousBalance: 0
            }
        });
        return (0, modules_1.successResponse)(res, "success", Object.assign(Object.assign({}, wallet), { pin: undefined, isActive: wallet.pin !== null }));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.createWallet = createWallet;
const viewWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const wallet = yield prisma_1.default.wallet.findFirst({
            where: { userId: id },
        });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, "Wallet not found");
        }
        const { pin } = wallet, walletData = __rest(wallet, ["pin"]);
        return (0, modules_1.successResponse)(res, "success", Object.assign(Object.assign({}, walletData), { isActive: pin !== null }));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "An error occurred", error);
    }
});
exports.viewWallet = viewWallet;
const debitWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id, role } = req.user;
    const result = body_1.paymentSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }
    const { amount, pin, reason, jobId } = result.data;
    const job = yield prisma_1.default.job.findUnique({
        where: { id: jobId },
        include: {
            client: { include: { profile: true } },
            professional: { include: { profile: true } }
        }
    });
    if (!job) {
        return (0, modules_1.handleResponse)(res, 404, false, 'Job not found');
    }
    if (job.payStatus === enum_1.PayStatus.PAID) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Job has already been paid for');
    }
    try {
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        if (!wallet.pin) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Pin not set');
        }
        const match = yield bcryptjs_1.default.compare(pin, wallet.pin);
        if (!match) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Incorrect pin');
        }
        let prevBalance = Number(wallet.currentBalance);
        if (prevBalance < amount) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Insufficient balance');
        }
        let currBalance = prevBalance - amount;
        yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: {
                currentBalance: currBalance,
                previousBalance: prevBalance
            }
        });
        const paymentRef = (0, modules_1.randomId)(12);
        yield prisma_1.default.job.update({
            where: { id: job.id },
            data: {
                payStatus: enum_1.PayStatus.PAID,
                paymentRef,
                status: enum_1.JobStatus.ONGOING,
            }
        });
        // Update client profile ongoing jobs
        if ((_a = job.client) === null || _a === void 0 ? void 0 : _a.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsOngoing: Number(job.client.profile.totalJobsOngoing || 0) + 1 }
            });
        }
        // Update professional profile ongoing jobs
        if ((_b = job.professional) === null || _b === void 0 ? void 0 : _b.profile) {
            yield prisma_1.default.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsOngoing: Number(job.professional.profile.totalJobsOngoing || 0) + 1 }
            });
        }
        const transaction = yield prisma_1.default.transaction.create({
            data: {
                userId: id,
                jobId: jobId || null,
                amount: amount,
                reference: paymentRef,
                status: 'success',
                channel: 'wallet',
                timestamp: new Date(),
                description: 'job wallet payment',
                type: enum_1.TransactionType.DEBIT,
            }
        });
        yield ledgerService_1.LedgerService.createEntry([
            {
                transactionId: transaction.id,
                userId: transaction.userId,
                amount: transaction.amount,
                type: enum_1.TransactionType.DEBIT,
                account: enum_1.Accounts.USER_WALLET
            },
            {
                transactionId: transaction.id,
                userId: null,
                amount: transaction.amount,
                type: enum_1.TransactionType.CREDIT,
                account: enum_1.Accounts.PLATFORM_ESCROW
            }
        ]);
        const emailTosend = (0, messages_1.jobPaymentEmail)(job);
        yield (0, gmail_1.sendEmail)(job.professional.email, emailTosend.title, emailTosend.body, job.professional.profile.firstName + ' ' + job.professional.profile.lastName);
        yield notification_1.NotificationService.create({
            userId: job.professionalId,
            type: enum_2.NotificationType.PAYMENT,
            title: 'Job Payment Received',
            message: `Your job "${job.title}" has been paid`,
            data: { jobId: job.id },
        });
        return (0, modules_1.successResponse)(res, 'success', transaction);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.debitWallet = debitWallet;
const debitWalletForProductOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { id, role } = req.user;
    const result = body_1.productPaymentSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }
    const { amount, pin, reason, productTransactionId } = result.data;
    const productTransaction = yield prisma_1.default.productTransaction.findUnique({
        where: { id: productTransactionId },
        include: {
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } },
            product: true,
            order: true,
        }
    });
    if (!productTransaction) {
        return (0, modules_1.handleResponse)(res, 404, false, 'Product transaction not found');
    }
    try {
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        if (!wallet.pin) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Pin not set');
        }
        const match = yield bcryptjs_1.default.compare(pin, wallet.pin);
        if (!match) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Incorrect pin');
        }
        let prevBalance = Number(wallet.currentBalance);
        if (prevBalance < amount) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Insufficient balance');
        }
        let desc;
        let isProductOrder = false;
        if (productTransaction.order && productTransaction.orderMethod !== enum_1.OrderMethod.SELF_PICKUP) {
            const productAndOrderCost = Number(productTransaction.order.cost) + Number(productTransaction.price);
            if (amount < productAndOrderCost) {
                return (0, modules_1.handleResponse)(res, 404, false, 'Insufficient amount for order and product');
            }
            desc = 'product_order wallet payment';
            isProductOrder = true;
        }
        else {
            if (amount < Number(productTransaction.price)) {
                return (0, modules_1.handleResponse)(res, 404, false, 'Insufficient amount for product');
            }
            desc = 'product wallet payment';
        }
        let currBalance = prevBalance - amount;
        yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: {
                currentBalance: currBalance,
                previousBalance: prevBalance
            }
        });
        yield prisma_1.default.productTransaction.update({
            where: { id: productTransaction.id },
            data: { status: enum_1.ProductTransactionStatus.ORDERED }
        });
        if (isProductOrder && productTransaction.order) {
            yield prisma_1.default.order.update({
                where: { id: productTransaction.order.id },
                data: { status: enum_1.OrderStatus.PAID }
            });
            // Auto-notify nearby riders about the new delivery
            const orderWithDetails = yield prisma_1.default.order.findUnique({
                where: { id: productTransaction.order.id },
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
            if (orderWithDetails) {
                const pickup = (_b = (_a = orderWithDetails.productTransaction) === null || _a === void 0 ? void 0 : _a.product) === null || _b === void 0 ? void 0 : _b.pickupLocation;
                const dropoff = orderWithDetails.dropoffLocation;
                if ((pickup === null || pickup === void 0 ? void 0 : pickup.latitude) && (pickup === null || pickup === void 0 ? void 0 : pickup.longitude) && (dropoff === null || dropoff === void 0 ? void 0 : dropoff.latitude) && (dropoff === null || dropoff === void 0 ? void 0 : dropoff.longitude)) {
                    (0, order_1.notifyNearbyRiders)(orderWithDetails, Number(pickup.latitude), Number(pickup.longitude), Number(dropoff.latitude), Number(dropoff.longitude));
                }
            }
        }
        const transaction = yield prisma_1.default.transaction.create({
            data: {
                userId: id,
                jobId: null,
                amount: amount,
                reference: (0, modules_1.randomId)(12),
                status: 'success',
                channel: 'wallet',
                timestamp: new Date(),
                productTransactionId,
                description: desc,
                type: enum_1.TransactionType.DEBIT,
            }
        });
        yield ledgerService_1.LedgerService.createEntry([
            {
                transactionId: transaction.id,
                userId: transaction.userId,
                amount: transaction.amount,
                type: enum_1.TransactionType.DEBIT,
                account: enum_1.Accounts.USER_WALLET
            },
            {
                transactionId: transaction.id,
                userId: null,
                amount: transaction.amount,
                type: enum_1.TransactionType.CREDIT,
                account: enum_1.Accounts.PLATFORM_ESCROW
            }
        ]);
        const emailContent = (0, messages_1.productPaymentEmail)(productTransaction);
        yield (0, gmail_1.sendEmail)(productTransaction.seller.email, emailContent.title, emailContent.body, ((_c = productTransaction.seller.profile) === null || _c === void 0 ? void 0 : _c.firstName) + ' ' + ((_d = productTransaction.seller.profile) === null || _d === void 0 ? void 0 : _d.lastName));
        yield notification_1.NotificationService.create({
            userId: productTransaction.sellerId,
            type: enum_2.NotificationType.PAYMENT,
            title: 'Product Payment Received',
            message: `${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.quantity} of your product: ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.product.name} has been paid by ${(_e = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _e === void 0 ? void 0 : _e.firstName} ${(_f = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _f === void 0 ? void 0 : _f.lastName}`,
            data: { productTransactionId: productTransaction.id },
        });
        // Self-pickup: notify vendor that buyer will collect the item
        if (productTransaction.orderMethod === enum_1.OrderMethod.SELF_PICKUP) {
            yield notification_1.NotificationService.create({
                userId: productTransaction.sellerId,
                type: enum_2.NotificationType.ORDER,
                title: 'Self-Pickup Order',
                message: `${(_g = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _g === void 0 ? void 0 : _g.firstName} ${(_h = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _h === void 0 ? void 0 : _h.lastName} will self-pickup ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.quantity}x ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.product.name}. Please prepare the item.`,
                data: { productTransactionId: productTransaction.id, orderMethod: 'self_pickup' },
            });
            try {
                const { getIO } = require('../chat');
                const { Emit } = require('../utils/events');
                getIO().to(productTransaction.sellerId).emit(Emit.ORDER_STATUS_UPDATE, {
                    data: {
                        productTransactionId: productTransaction.id,
                        status: 'self_pickup_paid',
                        orderMethod: 'self_pickup',
                        buyer: productTransaction.buyer,
                    }
                });
            }
            catch (e) { /* socket may not be initialized */ }
        }
        return (0, modules_1.successResponse)(res, 'success', transaction);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.debitWalletForProductOrder = debitWalletForProductOrder;
const setPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    const pinSchema = zod_1.default.object({
        pin: zod_1.default.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    });
    const result = pinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }
    const { pin } = result.data;
    try {
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        // Hash pin
        const hashedPin = yield bcryptjs_1.default.hash(pin, 10);
        yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });
        return (0, modules_1.successResponse)(res, 'success', 'Pin set successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'An error occurred');
    }
});
exports.setPin = setPin;
const resetPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    const result = body_1.pinResetSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }
    const { newPin, oldPin } = result.data;
    try {
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        // Check if old pin matches
        if (!wallet.pin) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Pin not set');
        }
        const isMatch = yield bcryptjs_1.default.compare(oldPin, wallet.pin);
        if (!isMatch) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Old pin does not match');
        }
        // Hash pin
        const hashedPin = yield bcryptjs_1.default.hash(newPin, 10);
        yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });
        return (0, modules_1.successResponse)(res, 'success', 'Pin reset successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.resetPin = resetPin;
const forgotPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    try {
        const result = body_1.pinForgotSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.format() });
        }
        const { newPin, newPinConfirm } = result.data;
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        // Check if old pin matches
        if (!wallet.pin) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Pin not set');
        }
        const hashedPin = yield bcryptjs_1.default.hash(newPin, 10);
        yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });
        return (0, modules_1.successResponse)(res, 'success', 'Pin reset successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.forgotPin = forgotPin;
const creditWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const { amount, userId } = req.body;
        const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: userId ? userId : id } });
        if (!wallet) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Wallet not found');
        }
        const updated = yield prisma_1.default.wallet.update({
            where: { id: wallet.id },
            data: {
                previousBalance: Number(wallet.currentBalance),
                currentBalance: Number(wallet.currentBalance) + Number(amount),
            }
        });
        return (0, modules_1.successResponse)(res, 'success', { balance: updated.currentBalance });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.creditWallet = creditWallet;
