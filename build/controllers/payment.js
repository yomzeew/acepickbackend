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
exports.verifyTransfer = exports.handlePaystackWebhook = exports.finalizeTransfer = exports.initiateTransfer = exports.verifyPayment = exports.initiatePayment = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const library_1 = require("@prisma/client/runtime/library");
const modules_1 = require("../utils/modules");
const configSetup_1 = __importDefault(require("../config/configSetup"));
const axios_1 = __importDefault(require("axios"));
const enum_1 = require("../utils/enum");
const notification_1 = require("../services/notification");
const enum_2 = require("../utils/enum");
const body_1 = require("../validation/body");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const chat_1 = require("../chat");
const events_1 = require("../utils/events");
const messages_1 = require("../utils/messages");
const gmail_1 = require("../services/gmail");
const order_1 = require("./order");
const ledgerService_1 = require("../services/ledgerService");
const initiatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { id, email, role } = req.user;
    try {
        const result = body_1.initPaymentSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
        }
        const { amount, description, jobId, productTransactionId } = result.data;
        let expectedAmount;
        switch (description.toLowerCase()) {
            case "job payment": {
                const job = yield prisma_1.default.job.findUnique({ where: { id: jobId } });
                expectedAmount = Number((_a = job === null || job === void 0 ? void 0 : job.workmanship) !== null && _a !== void 0 ? _a : 0) + Number((_b = job === null || job === void 0 ? void 0 : job.materialsCost) !== null && _b !== void 0 ? _b : 0);
                break;
            }
            case "product payment": {
                const productTrans = yield prisma_1.default.productTransaction.findUnique({
                    where: { id: productTransactionId }
                });
                expectedAmount = Number((_c = productTrans === null || productTrans === void 0 ? void 0 : productTrans.price) !== null && _c !== void 0 ? _c : 0);
                break;
            }
            case "product_order payment": {
                const productOrderTrans = yield prisma_1.default.productTransaction.findUnique({
                    where: { id: productTransactionId },
                    include: { order: true }
                });
                expectedAmount = Number((_d = productOrderTrans === null || productOrderTrans === void 0 ? void 0 : productOrderTrans.price) !== null && _d !== void 0 ? _d : 0)
                    + Number((_f = (_e = productOrderTrans === null || productOrderTrans === void 0 ? void 0 : productOrderTrans.order) === null || _e === void 0 ? void 0 : _e.cost) !== null && _f !== void 0 ? _f : 0);
                break;
            }
            default:
                break;
        }
        //expectedAmount is undefined for wallet topup
        if (expectedAmount) {
            if (amount < expectedAmount) {
                return (0, modules_1.handleResponse)(res, 400, false, "Insufficient amount");
            }
        }
        // Initiate payment with Paystack API
        const paystackResponseInit = yield axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email: email,
            amount: amount * 100,
        }, {
            headers: {
                Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            },
        });
        const data = paystackResponseInit.data.data;
        yield prisma_1.default.transaction.create({
            data: {
                userId: id,
                amount: amount,
                reference: data.reference,
                status: enum_1.TransactionStatus.PENDING,
                currency: data.currency,
                timestamp: new Date(),
                description: description.toLowerCase(),
                jobId: description.toString().includes('job') ? jobId : null,
                productTransactionId: description.toString().includes('product') ? productTransactionId : null,
                type: description.toLowerCase() === enum_1.TransactionDescription.WALLET_TOPUP ? enum_1.TransactionType.CREDIT : enum_1.TransactionType.DEBIT,
            }
        });
        return (0, modules_1.successResponse)(res, 'success', data);
    }
    catch (error) {
        return (0, modules_1.handleResponse)(res, 500, false, 'An error occurred while initiating payment');
    }
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { ref } = req.params;
    try {
        const paystackResponse = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${ref}`, {
            headers: {
                Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            },
        });
        const { data } = paystackResponse.data;
        if (data.status === enum_1.TransactionStatus.SUCCESS) {
            // Verification handled by webhook
        }
        return (0, modules_1.handleResponse)(res, 200, true, "Payment sucessfully verified", { result: paystackResponse.data });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.verifyPayment = verifyPayment;
const initiateTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.withdrawSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { amount, recipientCode, pin, reason } = result.data;
    const wallet = yield prisma_1.default.wallet.findFirst({ where: { userId: id } });
    if (!wallet) {
        return (0, modules_1.errorResponse)(res, 'error', 'Wallet not found');
    }
    if (!wallet.pin) {
        return (0, modules_1.handleResponse)(res, 403, false, 'Pin not set. Please set your pin to continue');
    }
    if (!bcryptjs_1.default.compareSync(pin, wallet.pin)) {
        return (0, modules_1.handleResponse)(res, 403, false, 'Invalid PIN');
    }
    if (amount > Number(wallet.currentBalance)) {
        return (0, modules_1.handleResponse)(res, 403, false, 'Insufficient balance');
    }
    const reference = (0, modules_1.randomId)(12);
    const transfer = yield prisma_1.default.transfer.create({
        data: {
            userId: id,
            amount,
            recipientCode,
            reference,
            reason,
            timestamp: new Date(),
        }
    });
    yield prisma_1.default.transaction.create({
        data: {
            userId: id,
            amount: amount,
            reference: transfer.reference,
            status: enum_1.TransactionStatus.PENDING,
            currency: 'NGN',
            timestamp: new Date(),
            description: 'wallet withdrawal',
            jobId: null,
            productTransactionId: null,
            type: enum_1.TransactionType.DEBIT,
        }
    });
    const response = yield axios_1.default.post('https://api.paystack.co/transfer', {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reference: reference,
        reason: reason,
    }, {
        headers: {
            Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    return (0, modules_1.successResponse)(res, 'success', response.data.data);
});
exports.initiateTransfer = initiateTransfer;
const finalizeTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transferCode, otp } = req.body;
    const response = yield axios_1.default.post('https://api.paystack.co/transfer/finalize_transfer', {
        transfer_code: transferCode,
        otp: otp
    }, {
        headers: {
            Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return (0, modules_1.successResponse)(res, 'success', response.data.data);
});
exports.finalizeTransfer = finalizeTransfer;
const handlePaystackWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const payload = req.body;
    console.log("webhook called");
    console.log(payload.event);
    try {
        if (payload.event.includes('transfer')) {
            const transfer = yield prisma_1.default.transfer.findFirst({
                where: { reference: payload.data.reference }
            });
            const transaction = yield prisma_1.default.transaction.findFirst({
                where: { reference: payload.data.reference }
            });
            if (!transfer) {
                return res.status(200).send('Transfer not found');
            }
            if (!transaction) {
                return res.status(200).send('Transaction not found');
            }
            const user = yield prisma_1.default.user.findUnique({
                where: { id: transfer.userId },
                include: { onlineUser: true, wallet: true }
            });
            if (!user) {
                return res.status(200).send('User not found');
            }
            switch (payload.event) {
                case 'transfer.success':
                    yield prisma_1.default.transfer.update({
                        where: { id: transfer.id },
                        data: { status: enum_1.TransferStatus.SUCCESS }
                    });
                    yield prisma_1.default.transaction.update({
                        where: { id: transaction.id },
                        data: { status: enum_1.TransactionStatus.SUCCESS }
                    });
                    if (user.wallet) {
                        yield prisma_1.default.wallet.update({
                            where: { id: user.wallet.id },
                            data: {
                                previousBalance: user.wallet.currentBalance,
                                currentBalance: new library_1.Decimal(user.wallet.currentBalance).sub(new library_1.Decimal(transfer.amount))
                            }
                        });
                    }
                    yield ledgerService_1.LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.DEBIT,
                            account: enum_1.Accounts.PROFESSIONAL_WALLET
                        },
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.CREDIT,
                            account: enum_1.Accounts.PAYMENT_GATEWAY
                        }
                    ]);
                    yield notification_1.NotificationService.create({
                        userId: user.id,
                        type: enum_2.NotificationType.PAYMENT,
                        title: 'Transfer Successful',
                        message: `Your transfer of ${transfer.amount} was successful`,
                        data: { transferId: transfer.id },
                    });
                    break;
                case 'transfer.failed':
                    yield prisma_1.default.transfer.update({
                        where: { id: transfer.id },
                        data: { status: enum_1.TransferStatus.FAILED }
                    });
                    yield notification_1.NotificationService.create({
                        userId: user.id,
                        type: enum_2.NotificationType.PAYMENT,
                        title: 'Transfer Failed',
                        message: `Your transfer of ${transfer.amount} failed`,
                        data: { transferId: transfer.id },
                    });
                    break;
                case 'transfer.reversed':
                    yield notification_1.NotificationService.create({
                        userId: user.id,
                        type: enum_2.NotificationType.PAYMENT,
                        title: 'Transfer Reversed',
                        message: `Your transfer of ${transfer.amount} has been reversed`,
                        data: { transferId: transfer.id },
                    });
                    break;
                default:
                    break;
            }
            return (0, modules_1.handleResponse)(res, 200, true, 'Handled');
        }
        else if (payload.event.includes('charge.success')) {
            const { reference, status, channel, paid_at } = payload.data;
            const transaction = yield prisma_1.default.transaction.findFirst({
                where: { reference },
                include: {
                    user: {
                        include: { onlineUser: true, wallet: true }
                    }
                }
            });
            if (!transaction) {
                return res.status(200).send('Transaction not found');
            }
            if (transaction.status === enum_1.TransactionStatus.SUCCESS) {
                return res.status(200).send('Transaction already processed');
            }
            yield prisma_1.default.transaction.update({
                where: { id: transaction.id },
                data: {
                    status,
                    channel,
                    timestamp: new Date(paid_at),
                }
            });
            if (transaction.jobId
                && (transaction.description === enum_1.TransactionDescription.JOB_PAYMENT)) {
                const job = yield prisma_1.default.job.findUnique({
                    where: { id: transaction.jobId },
                    include: {
                        professional: { include: { profile: true } },
                        client: { include: { profile: true } }
                    }
                });
                if (job) {
                    yield prisma_1.default.job.update({
                        where: { id: job.id },
                        data: {
                            status: enum_1.JobStatus.ONGOING,
                            payStatus: enum_1.PayStatus.PAID,
                            paymentRef: reference,
                        }
                    });
                    yield ledgerService_1.LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.DEBIT,
                            account: enum_1.Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: null,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.CREDIT,
                            account: enum_1.Accounts.PLATFORM_ESCROW
                        }
                    ]);
                    yield notification_1.NotificationService.create({
                        userId: job.professionalId,
                        type: enum_2.NotificationType.PAYMENT,
                        title: 'Job Payment Received',
                        message: `Job "${job === null || job === void 0 ? void 0 : job.title}" has been paid by ${(_b = (_a = job === null || job === void 0 ? void 0 : job.client) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.firstName} ${(_d = (_c = job === null || job === void 0 ? void 0 : job.client) === null || _c === void 0 ? void 0 : _c.profile) === null || _d === void 0 ? void 0 : _d.lastName}`,
                        data: { jobId: job.id },
                    });
                    const emailContent = (0, messages_1.jobPaymentEmail)(job);
                    yield (0, gmail_1.sendEmail)(job.professional.email, emailContent.title, emailContent.body, job.professional.profile.firstName + ' ' + job.professional.profile.lastName);
                }
            }
            if (transaction.productTransactionId
                && (transaction.description === enum_1.TransactionDescription.PRODUCT_PAYMENT
                    || transaction.description === enum_1.TransactionDescription.PRODUCT_ORDER_PAYMENT)) {
                const productTransaction = yield prisma_1.default.productTransaction.findUnique({
                    where: { id: transaction.productTransactionId },
                    include: {
                        buyer: { include: { profile: true } },
                        seller: { include: { profile: true } },
                        product: true
                    }
                });
                if (productTransaction) {
                    yield prisma_1.default.productTransaction.update({
                        where: { id: productTransaction.id },
                        data: { status: enum_1.ProductTransactionStatus.ORDERED }
                    });
                    yield prisma_1.default.product.update({
                        where: { id: productTransaction.product.id },
                        data: { quantity: productTransaction.product.quantity - productTransaction.quantity }
                    });
                    yield ledgerService_1.LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.DEBIT,
                            account: enum_1.Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: null,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.CREDIT,
                            account: enum_1.Accounts.PLATFORM_ESCROW
                        }
                    ]);
                    //send notification to seller
                    yield notification_1.NotificationService.create({
                        userId: productTransaction.sellerId,
                        type: enum_2.NotificationType.PAYMENT,
                        title: 'Product Payment Received',
                        message: `${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.quantity} of your product: ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.product.name} has been paid by ${(_e = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _e === void 0 ? void 0 : _e.firstName} ${(_f = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _f === void 0 ? void 0 : _f.lastName}`,
                        data: { productTransactionId: productTransaction.id },
                    });
                    //send email to seller
                    const emailContent = (0, messages_1.productPaymentEmail)(productTransaction);
                    yield (0, gmail_1.sendEmail)(productTransaction.seller.email, emailContent.title, emailContent.body, ((_g = productTransaction.seller.profile) === null || _g === void 0 ? void 0 : _g.firstName) + ' ' + ((_h = productTransaction.seller.profile) === null || _h === void 0 ? void 0 : _h.lastName));
                    // Self-pickup: notify vendor that buyer will collect the item
                    if (productTransaction.orderMethod === enum_1.OrderMethod.SELF_PICKUP) {
                        yield notification_1.NotificationService.create({
                            userId: productTransaction.sellerId,
                            type: enum_2.NotificationType.ORDER,
                            title: 'Self-Pickup Order',
                            message: `${(_j = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _j === void 0 ? void 0 : _j.firstName} ${(_k = productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.buyer.profile) === null || _k === void 0 ? void 0 : _k.lastName} will self-pickup ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.quantity}x ${productTransaction === null || productTransaction === void 0 ? void 0 : productTransaction.product.name}. Please prepare the item.`,
                            data: { productTransactionId: productTransaction.id, orderMethod: 'self_pickup' },
                        });
                        try {
                            (0, chat_1.getIO)().to(productTransaction.sellerId).emit(events_1.Emit.ORDER_STATUS_UPDATE, {
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
                }
            }
            if (transaction.description === enum_1.TransactionDescription.PRODUCT_ORDER_PAYMENT) {
                const order = yield prisma_1.default.order.findFirst({
                    where: {
                        productTransactionId: transaction.productTransactionId,
                        status: enum_1.OrderStatus.PENDING,
                    }
                });
                if (order) {
                    yield prisma_1.default.order.update({
                        where: { id: order.id },
                        data: { status: enum_1.OrderStatus.PAID }
                    });
                    // Auto-notify nearby riders about the new delivery
                    const orderWithDetails = yield prisma_1.default.order.findUnique({
                        where: { id: order.id },
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
                        const pickup = (_m = (_l = orderWithDetails.productTransaction) === null || _l === void 0 ? void 0 : _l.product) === null || _m === void 0 ? void 0 : _m.pickupLocation;
                        const dropoff = orderWithDetails.dropoffLocation;
                        if ((pickup === null || pickup === void 0 ? void 0 : pickup.latitude) && (pickup === null || pickup === void 0 ? void 0 : pickup.longitude) && (dropoff === null || dropoff === void 0 ? void 0 : dropoff.latitude) && (dropoff === null || dropoff === void 0 ? void 0 : dropoff.longitude)) {
                            (0, order_1.notifyNearbyRiders)(orderWithDetails, Number(pickup.latitude), Number(pickup.longitude), Number(dropoff.latitude), Number(dropoff.longitude));
                        }
                    }
                }
            }
            if (transaction.description === enum_1.TransactionDescription.WALLET_TOPUP) {
                if (transaction.user.wallet) {
                    let prevAmount = Number(transaction.user.wallet.currentBalance);
                    let newAmount = Number(transaction.amount);
                    yield prisma_1.default.wallet.update({
                        where: { id: transaction.user.wallet.id },
                        data: {
                            previousBalance: prevAmount,
                            currentBalance: prevAmount + newAmount,
                        }
                    });
                    yield ledgerService_1.LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.DEBIT,
                            account: enum_1.Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: enum_1.TransactionType.CREDIT,
                            account: enum_1.Accounts.USER_WALLET
                        }
                    ]);
                }
            }
            yield notification_1.NotificationService.create({
                userId: transaction.userId,
                type: enum_2.NotificationType.PAYMENT,
                title: 'Payment Successful',
                message: `Your payment of ${transaction.amount} was successful`,
                data: { transactionId: transaction.id },
            });
            const io = (0, chat_1.getIO)();
            if ((_o = transaction.user.onlineUser) === null || _o === void 0 ? void 0 : _o.isOnline) {
                io.to((_p = transaction.user.onlineUser) === null || _p === void 0 ? void 0 : _p.socketId).emit(events_1.Emit.PAYMENT_SUCCESS, {
                    text: 'Payment Success', data: {
                        id: transaction.id,
                        status: transaction.status,
                        channel: transaction.channel,
                        amount: transaction.amount,
                        reference: transaction.reference,
                        timeStamp: transaction.timestamp,
                        type: transaction.type,
                        createdAt: transaction.createdAt,
                        updatedAt: transaction.updatedAt,
                    }
                });
            }
            return (0, modules_1.handleResponse)(res, 200, true, 'Handled');
        }
        else {
            return (0, modules_1.handleResponse)(res, 400, false, 'Invalid event type');
        }
    }
    catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal server error');
    }
});
exports.handlePaystackWebhook = handlePaystackWebhook;
const verifyTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ref } = req.params;
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/transfer/verify/${ref}`, {
            headers: {
                'Authorization': `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`
            }
        });
        return (0, modules_1.successResponse)(res, 'success', response.data.data);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', error.response.data.message);
    }
});
exports.verifyTransfer = verifyTransfer;
