import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import prisma from "../config/prisma";
import { errorResponse, handleResponse, successResponse, randomId } from "../utils/modules";
import { Accounts, JobStatus, OrderMethod, OrderStatus, PayStatus, ProductTransactionStatus, TransactionType } from "../utils/enum";
import { paymentSchema, pinForgotSchema, pinResetSchema, productPaymentSchema } from "../validation/body";
import { jobPaymentEmail, productPaymentEmail } from "../utils/messages";
import { sendEmail } from "../services/gmail";
import { NotificationService } from "../services/notification";
import { NotificationType } from "../utils/enum";
import z from "zod";
import { LedgerService } from "../services/ledgerService";
import { notifyNearbyRiders } from "./order";

export const createWallet = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { currency = 'NGN' } = req.body;

    try {
        const wallet = await prisma.wallet.create({
            data: {
                userId: id,
                currency: currency,
                currentBalance: 0,
                previousBalance: 0
            }
        });

        return successResponse(res, "success", { ...wallet, pin: undefined, isActive: wallet.pin !== null });
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}

export const viewWallet = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const wallet = await prisma.wallet.findFirst({
            where: { userId: id },
        });

        if (!wallet) {
            return handleResponse(res, 404, false, "Wallet not found");
        }

        const { pin, ...walletData } = wallet;

        return successResponse(res, "success", { ...walletData, isActive: pin !== null });
    } catch (error) {
        return errorResponse(res, "An error occurred", error);
    }
}

export const debitWallet = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    const result = paymentSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }

    const { amount, pin, reason, jobId } = result.data;

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
            client: { include: { profile: true } },
            professional: { include: { profile: true } }
        }
    });

    if (!job) {
        return handleResponse(res, 404, false, 'Job not found');
    }

    if (job.payStatus === PayStatus.PAID) {
        return handleResponse(res, 400, false, 'Job has already been paid for')
    }

    try {
        const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        if (!wallet.pin) {
            return handleResponse(res, 400, false, 'Pin not set')
        }

        const match = await bcrypt.compare(pin, wallet.pin);

        if (!match) {
            return handleResponse(res, 400, false, 'Incorrect pin')
        }

        let prevBalance = Number(wallet.currentBalance);

        if (prevBalance < amount) {
            return handleResponse(res, 400, false, 'Insufficient balance')
        }

        let currBalance = prevBalance - amount;

        await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                currentBalance: currBalance,
                previousBalance: prevBalance
            }
        });

        const paymentRef = randomId(12);

        await prisma.job.update({
            where: { id: job.id },
            data: {
                payStatus: PayStatus.PAID as any,
                paymentRef,
                status: JobStatus.ONGOING as any,
            }
        });

        // Update client profile ongoing jobs
        if (job.client?.profile) {
            await prisma.profile.update({
                where: { id: job.client.profile.id },
                data: { totalJobsOngoing: Number(job.client.profile.totalJobsOngoing || 0) + 1 }
            });
        }

        // Update professional profile ongoing jobs
        if (job.professional?.profile) {
            await prisma.profile.update({
                where: { id: job.professional.profile.id },
                data: { totalJobsOngoing: Number(job.professional.profile.totalJobsOngoing || 0) + 1 }
            });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: id,
                jobId: jobId || null,
                amount: amount,
                reference: paymentRef,
                status: 'success',
                channel: 'wallet',
                timestamp: new Date(),
                description: 'job wallet payment',
                type: TransactionType.DEBIT as any,
            }
        })

        await LedgerService.createEntry([
            {
                transactionId: transaction.id,
                userId: transaction.userId,
                amount: transaction.amount,
                type: TransactionType.DEBIT,
                account: Accounts.USER_WALLET
            },
            {
                transactionId: transaction.id,
                userId: null,
                amount: transaction.amount,
                type: TransactionType.CREDIT,
                account: Accounts.PLATFORM_ESCROW
            }
        ])

        const emailTosend = jobPaymentEmail(job);

        await sendEmail(
            job.professional!.email,
            emailTosend.title,
            emailTosend.body,
            job.professional!.profile!.firstName + ' ' + job.professional!.profile!.lastName
        )

        await NotificationService.create({
            userId: job.professionalId,
            type: NotificationType.PAYMENT,
            title: 'Job Payment Received',
            message: `Your job "${job.title}" has been paid`,
            data: { jobId: job.id },
        });

        return successResponse(res, 'success', transaction)

    } catch (error: any) {
        return errorResponse(res, 'error', error.message)
    }
}

export const debitWalletForProductOrder = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    const result = productPaymentSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }

    const { amount, pin, reason, productTransactionId } = result.data;

    const productTransaction = await prisma.productTransaction.findUnique({
        where: { id: productTransactionId },
        include: {
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } },
            product: true,
            order: true,
        }
    });

    if (!productTransaction) {
        return handleResponse(res, 404, false, 'Product transaction not found');
    }

    try {
        const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        if (!wallet.pin) {
            return handleResponse(res, 400, false, 'Pin not set')
        }

        const match = await bcrypt.compare(pin, wallet.pin);

        if (!match) {
            return handleResponse(res, 400, false, 'Incorrect pin')
        }

        let prevBalance = Number(wallet.currentBalance);

        if (prevBalance < amount) {
            return handleResponse(res, 400, false, 'Insufficient balance')
        }

        let desc;
        let isProductOrder = false;

        if (productTransaction.order && productTransaction.orderMethod !== OrderMethod.SELF_PICKUP) {
            const productAndOrderCost = Number(productTransaction.order.cost) + Number(productTransaction.price)

            if (amount < productAndOrderCost) {
                return handleResponse(res, 404, false, 'Insufficient amount for order and product')
            }

            desc = 'product_order wallet payment'
            isProductOrder = true
        } else {
            if (amount < Number(productTransaction.price)) {
                return handleResponse(res, 404, false, 'Insufficient amount for product')
            }

            desc = 'product wallet payment'
        }

        let currBalance = prevBalance - amount;

        await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                currentBalance: currBalance,
                previousBalance: prevBalance
            }
        });

        await prisma.productTransaction.update({
            where: { id: productTransaction.id },
            data: { status: ProductTransactionStatus.ORDERED as any }
        });

        if (isProductOrder && productTransaction.order) {
            await prisma.order.update({
                where: { id: productTransaction.order.id },
                data: { status: OrderStatus.PAID as any }
            });

            // Auto-notify nearby riders about the new delivery
            const orderWithDetails = await prisma.order.findUnique({
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
                const pickup = orderWithDetails.productTransaction?.product?.pickupLocation;
                const dropoff = orderWithDetails.dropoffLocation;
                if (pickup?.latitude && pickup?.longitude && dropoff?.latitude && dropoff?.longitude) {
                    notifyNearbyRiders(
                        orderWithDetails,
                        Number(pickup.latitude), Number(pickup.longitude),
                        Number(dropoff.latitude), Number(dropoff.longitude)
                    );
                }
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: id,
                jobId: null,
                amount: amount,
                reference: randomId(12),
                status: 'success',
                channel: 'wallet',
                timestamp: new Date(),
                productTransactionId,
                description: desc,
                type: TransactionType.DEBIT as any,
            }
        })

        await LedgerService.createEntry([
            {
                transactionId: transaction.id,
                userId: transaction.userId,
                amount: transaction.amount,
                type: TransactionType.DEBIT,
                account: Accounts.USER_WALLET
            },
            {
                transactionId: transaction.id,
                userId: null,
                amount: transaction.amount,
                type: TransactionType.CREDIT,
                account: Accounts.PLATFORM_ESCROW
            }
        ])

        const emailContent = productPaymentEmail(productTransaction);

        await sendEmail(
            productTransaction.seller.email,
            emailContent.title,
            emailContent.body,
            productTransaction.seller.profile?.firstName + ' ' + productTransaction.seller.profile?.lastName,
        )

        await NotificationService.create({
            userId: productTransaction.sellerId,
            type: NotificationType.PAYMENT,
            title: 'Product Payment Received',
            message: `${productTransaction?.quantity} of your product: ${productTransaction?.product.name} has been paid by ${productTransaction?.buyer.profile?.firstName} ${productTransaction?.buyer.profile?.lastName}`,
            data: { productTransactionId: productTransaction.id },
        });

        // Self-pickup: notify vendor that buyer will collect the item
        if (productTransaction.orderMethod === OrderMethod.SELF_PICKUP) {
            await NotificationService.create({
                userId: productTransaction.sellerId,
                type: NotificationType.ORDER,
                title: 'Self-Pickup Order',
                message: `${productTransaction?.buyer.profile?.firstName} ${productTransaction?.buyer.profile?.lastName} will self-pickup ${productTransaction?.quantity}x ${productTransaction?.product.name}. Please prepare the item.`,
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
            } catch (e) { /* socket may not be initialized */ }
        }

        return successResponse(res, 'success', transaction)

    } catch (error: any) {
        return errorResponse(res, 'error', error.message)
    }
}

export const setPin = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    const pinSchema = z.object({
        pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
    })

    const result = pinSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }

    const { pin } = result.data;

    try {
        const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        // Hash pin
        const hashedPin = await bcrypt.hash(pin, 10);

        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });

        return successResponse(res, 'success', 'Pin set successfully')

    } catch (error) {
        return errorResponse(res, 'error', 'An error occurred')
    }
}


export const resetPin = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    const result = pinResetSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }

    const { newPin, oldPin } = result.data;

    try {
        const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        // Check if old pin matches
        if (!wallet.pin) {
            return handleResponse(res, 400, false, 'Pin not set')
        }

        const isMatch = await bcrypt.compare(oldPin, wallet.pin);

        if (!isMatch) {
            return handleResponse(res, 400, false, 'Old pin does not match')
        }

        // Hash pin
        const hashedPin = await bcrypt.hash(newPin, 10);

        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });

        return successResponse(res, 'success', 'Pin reset successfully')
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const forgotPin = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    try {
        const result = pinForgotSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.format() });
        }

        const { newPin, newPinConfirm } = result.data;

        const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        // Check if old pin matches
        if (!wallet.pin) {
            return handleResponse(res, 400, false, 'Pin not set')
        }

        const hashedPin = await bcrypt.hash(newPin, 10);

        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { pin: hashedPin }
        });

        return successResponse(res, 'success', 'Pin reset successfully')
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const creditWallet = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;
        const { amount, userId } = req.body;

        const wallet = await prisma.wallet.findFirst({ where: { userId: userId ? userId : id } });

        if (!wallet) {
            return handleResponse(res, 404, false, 'Wallet not found')
        }

        const updated = await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                previousBalance: Number(wallet.currentBalance),
                currentBalance: Number(wallet.currentBalance) + Number(amount),
            }
        });

        return successResponse(res, 'success', { balance: updated.currentBalance })
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}
