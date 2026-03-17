import { Request, Response } from "express";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { randomId, errorResponse, handleResponse, successResponse } from "../utils/modules";
import config from "../config/configSetup"
import axios from 'axios'
import { Accounts, JobStatus, OrderMethod, OrderStatus, PayStatus, ProductStatus, ProductTransactionStatus, TransactionDescription, TransactionStatus, TransactionType, TransferStatus } from "../utils/enum";
import { NotificationService } from "../services/notification";
import { NotificationType } from "../utils/enum";
import { initPaymentSchema, withdrawSchema } from "../validation/body";
import bcrypt from 'bcryptjs';
import { getIO } from "../chat";
import { Emit } from "../utils/events";
import { jobPaymentEmail, productPaymentEmail } from "../utils/messages";
import { sendEmail } from "../services/gmail";
import { notifyNearbyRiders } from "./order";
import { LedgerService } from "../services/ledgerService";



export const initiatePayment = async (req: Request, res: Response) => {
    const { id, email, role } = req.user
    

    try {
        const result = initPaymentSchema.safeParse(req.body);

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
                const job = await prisma.job.findUnique({ where: { id: jobId! } });
                expectedAmount = Number(job?.workmanship ?? 0) + Number(job?.materialsCost ?? 0);
                break;
            }
        
            case "product payment": {
                const productTrans = await prisma.productTransaction.findUnique({
                    where: { id: productTransactionId! }
                });
                expectedAmount = Number(productTrans?.price ?? 0);
                break;
            }
        
            case "product_order payment": {
                const productOrderTrans = await prisma.productTransaction.findUnique({
                    where: { id: productTransactionId! },
                    include: { order: true }
                });
                expectedAmount = Number(productOrderTrans?.price ?? 0) 
                               + Number(productOrderTrans?.order?.cost ?? 0);
                break;
            }
        
            default:
                break;
        }
        
        //expectedAmount is undefined for wallet topup
        if(expectedAmount){
            if(amount < expectedAmount){
                return handleResponse(res, 400, false, "Insufficient amount");
            }
        }

        // Initiate payment with Paystack API
        const paystackResponseInit = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email: email,
                amount: amount * 100,
            },
            {
                headers: {
                    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const data = paystackResponseInit.data.data;

        await prisma.transaction.create({
            data: {
                userId: id,
                amount: amount,
                reference: data.reference,
                status: TransactionStatus.PENDING as any,
                currency: data.currency,
                timestamp: new Date(),
                description: description.toLowerCase(),
                jobId: description.toString().includes('job') ? jobId : null,
                productTransactionId: description.toString().includes('product') ? productTransactionId : null,
                type: description.toLowerCase() === TransactionDescription.WALLET_TOPUP ? TransactionType.CREDIT as any : TransactionType.DEBIT as any,
            }
        })

        return successResponse(res, 'success', data)
    } catch (error) {
        return handleResponse(res, 500, false, 'An error occurred while initiating payment')
    }
}

export const verifyPayment = async (req: Request, res: Response) => {
    const { id } = req.user
    const { ref } = req.params

    try {

        const paystackResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${ref}`,
            {
                headers: {
                    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const { data } = paystackResponse.data;

        if (data.status === TransactionStatus.SUCCESS) {
            // Verification handled by webhook
        }

        return handleResponse(res, 200, true, "Payment sucessfully verified", { result: paystackResponse.data })
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}


export const initiateTransfer = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = withdrawSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { amount, recipientCode, pin, reason } = result.data;

    const wallet = await prisma.wallet.findFirst({ where: { userId: id } });

    if (!wallet) {
        return errorResponse(res, 'error', 'Wallet not found');
    }

    if (!wallet.pin) {
        return handleResponse(res, 403, false, 'Pin not set. Please set your pin to continue');
    }

    if (!bcrypt.compareSync(pin, wallet.pin)) {
        return handleResponse(res, 403, false, 'Invalid PIN');
    }

    if (amount > Number(wallet.currentBalance)) {
        return handleResponse(res, 403, false, 'Insufficient balance');
    }

    const reference = randomId(12);

    const transfer = await prisma.transfer.create({
        data: {
            userId: id,
            amount,
            recipientCode,
            reference,
            reason,
            timestamp: new Date(),
        }
    })

    await prisma.transaction.create({
        data: {
            userId: id,
            amount: amount,
            reference: transfer.reference,
            status: TransactionStatus.PENDING as any,
            currency: 'NGN',
            timestamp: new Date(),
            description: 'wallet withdrawal',
            jobId: null,
            productTransactionId: null,
            type: TransactionType.DEBIT as any,
        }
    })

    const response = await axios.post(
        'https://api.paystack.co/transfer',
        {
            source: 'balance',
            amount: amount * 100,
            recipient: recipientCode,
            reference: reference,
            reason: reason,
        },
        {
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return successResponse(res, 'success', response.data.data);
}

export const finalizeTransfer = async (req: Request, res: Response) => {
    const { transferCode, otp } = req.body;

    const response = await axios.post('https://api.paystack.co/transfer/finalize_transfer', {
        transfer_code: transferCode,
        otp: otp
    }, {
        headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })

    return successResponse(res, 'success', response.data.data);
}

export const handlePaystackWebhook = async (req: Request, res: Response) => {
    const payload = req.body;
    console.log("webhook called");
    console.log(payload.event);

    try {
        if (payload.event.includes('transfer')) {
            const transfer = await prisma.transfer.findFirst({
                where: { reference: payload.data.reference }
            });

            const transaction = await prisma.transaction.findFirst({
                where: { reference: payload.data.reference }
            });

            if (!transfer) {
                return res.status(200).send('Transfer not found');
            }

            if (!transaction) {
                return res.status(200).send('Transaction not found');
            }

            const user = await prisma.user.findUnique({
                where: { id: transfer.userId },
                include: { onlineUser: true, wallet: true }
            });

            if (!user) {
                return res.status(200).send('User not found');
            }

            switch (payload.event) {
                case 'transfer.success':
                    await prisma.transfer.update({
                        where: { id: transfer.id },
                        data: { status: TransferStatus.SUCCESS as any }
                    });

                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { status: TransactionStatus.SUCCESS as any }
                    });

                    if (user.wallet) {
                        await prisma.wallet.update({
                            where: { id: user.wallet.id },
                            data: {
                                previousBalance: user.wallet.currentBalance,
                                currentBalance: new Decimal(user.wallet.currentBalance).sub(new Decimal(transfer.amount))
                            }
                        });
                    }

                    await LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.DEBIT,
                            account: Accounts.PROFESSIONAL_WALLET
                        },
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.CREDIT,
                            account: Accounts.PAYMENT_GATEWAY
                        }
                    ])

                    await NotificationService.create({
                        userId: user.id,
                        type: NotificationType.PAYMENT,
                        title: 'Transfer Successful',
                        message: `Your transfer of ${transfer.amount} was successful`,
                        data: { transferId: transfer.id },
                    });
                    break;

                case 'transfer.failed':
                    await prisma.transfer.update({
                        where: { id: transfer.id },
                        data: { status: TransferStatus.FAILED as any }
                    });

                    await NotificationService.create({
                        userId: user.id,
                        type: NotificationType.PAYMENT,
                        title: 'Transfer Failed',
                        message: `Your transfer of ${transfer.amount} failed`,
                        data: { transferId: transfer.id },
                    });
                    break;

                case 'transfer.reversed':
                    await NotificationService.create({
                        userId: user.id,
                        type: NotificationType.PAYMENT,
                        title: 'Transfer Reversed',
                        message: `Your transfer of ${transfer.amount} has been reversed`,
                        data: { transferId: transfer.id },
                    });
                    break;

                default:
                    break;
            }

            return handleResponse(res, 200, true, 'Handled')
        } else if (payload.event.includes('charge.success')) {
            const { reference, status, channel, paid_at } = payload.data;

            const transaction = await prisma.transaction.findFirst({
                where: { reference },
                include: {
                    user: {
                        include: { onlineUser: true, wallet: true }
                    }
                }
            })

            if (!transaction) {
                return res.status(200).send('Transaction not found');
            }

            if (transaction.status === TransactionStatus.SUCCESS) {
                return res.status(200).send('Transaction already processed');
            }

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status,
                    channel,
                    timestamp: new Date(paid_at),
                }
            });

            if (transaction.jobId
                && (transaction.description === TransactionDescription.JOB_PAYMENT)) {
                const job = await prisma.job.findUnique({
                    where: { id: transaction.jobId },
                    include: {
                        professional: { include: { profile: true } },
                        client: { include: { profile: true } }
                    }
                });

                if (job) {
                    await prisma.job.update({
                        where: { id: job.id },
                        data: {
                            status: JobStatus.ONGOING as any,
                            payStatus: PayStatus.PAID as any,
                            paymentRef: reference,
                        }
                    });

                    await LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.DEBIT,
                            account: Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: null,
                            amount: transaction.amount,
                            type: TransactionType.CREDIT,
                            account: Accounts.PLATFORM_ESCROW
                        }
                    ])

                    await NotificationService.create({
                        userId: job.professionalId,
                        type: NotificationType.PAYMENT,
                        title: 'Job Payment Received',
                        message: `Job "${job?.title}" has been paid by ${job?.client?.profile?.firstName} ${job?.client?.profile?.lastName}`,
                        data: { jobId: job.id },
                    });

                    const emailContent = jobPaymentEmail(job)

                    await sendEmail(
                        job.professional!.email,
                        emailContent.title,
                        emailContent.body,
                        job.professional!.profile!.firstName + ' ' + job.professional!.profile!.lastName
                    )
                }
            }

            if (transaction.productTransactionId
                && (transaction.description === TransactionDescription.PRODUCT_PAYMENT
                    || transaction.description === TransactionDescription.PRODUCT_ORDER_PAYMENT)) {
                const productTransaction = await prisma.productTransaction.findUnique({
                    where: { id: transaction.productTransactionId },
                    include: {
                        buyer: { include: { profile: true } },
                        seller: { include: { profile: true } },
                        product: true
                    }
                });

                if (productTransaction) {
                    await prisma.productTransaction.update({
                        where: { id: productTransaction.id },
                        data: { status: ProductTransactionStatus.ORDERED as any }
                    });

                    await prisma.product.update({
                        where: { id: productTransaction.product.id },
                        data: { quantity: productTransaction.product.quantity - productTransaction.quantity }
                    });

                    await LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.DEBIT,
                            account: Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: null,
                            amount: transaction.amount,
                            type: TransactionType.CREDIT,
                            account: Accounts.PLATFORM_ESCROW
                        }
                    ])

                    //send notification to seller
                    await NotificationService.create({
                        userId: productTransaction.sellerId,
                        type: NotificationType.PAYMENT,
                        title: 'Product Payment Received',
                        message: `${productTransaction?.quantity} of your product: ${productTransaction?.product.name} has been paid by ${productTransaction?.buyer.profile?.firstName} ${productTransaction?.buyer.profile?.lastName}`,
                        data: { productTransactionId: productTransaction.id },
                    });

                    //send email to seller
                    const emailContent = productPaymentEmail(productTransaction);

                    await sendEmail(
                        productTransaction.seller.email,
                        emailContent.title,
                        emailContent.body,
                        productTransaction.seller.profile?.firstName + ' ' + productTransaction.seller.profile?.lastName,
                    )

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
                }
            }

            if (transaction.description === TransactionDescription.PRODUCT_ORDER_PAYMENT) {
                const order = await prisma.order.findFirst({
                    where: {
                        productTransactionId: transaction.productTransactionId!,
                        status: OrderStatus.PENDING as any,
                    }
                })

                if (order) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: OrderStatus.PAID as any }
                    });

                    // Auto-notify nearby riders about the new delivery
                    const orderWithDetails = await prisma.order.findUnique({
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
            }

            if (transaction.description === TransactionDescription.WALLET_TOPUP) {
                if (transaction.user.wallet) {
                    let prevAmount = Number(transaction.user.wallet.currentBalance);
                    let newAmount = Number(transaction.amount);

                    await prisma.wallet.update({
                        where: { id: transaction.user.wallet.id },
                        data: {
                            previousBalance: prevAmount,
                            currentBalance: prevAmount + newAmount,
                        }
                    });

                    await LedgerService.createEntry([
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.DEBIT,
                            account: Accounts.PAYMENT_GATEWAY
                        },
                        {
                            transactionId: transaction.id,
                            userId: transaction.userId,
                            amount: transaction.amount,
                            type: TransactionType.CREDIT,
                            account: Accounts.USER_WALLET
                        }
                    ])
                }
            }

            await NotificationService.create({
                userId: transaction.userId,
                type: NotificationType.PAYMENT,
                title: 'Payment Successful',
                message: `Your payment of ${transaction.amount} was successful`,
                data: { transactionId: transaction.id },
            });

            const io = getIO();

            if (transaction.user.onlineUser?.isOnline) {
                io.to(transaction.user.onlineUser?.socketId).emit(Emit.PAYMENT_SUCCESS, {
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

            return handleResponse(res, 200, true, 'Handled');
        } else {
            return handleResponse(res, 400, false, 'Invalid event type')
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal server error');
    }
}

export const verifyTransfer = async (req: Request, res: Response) => {
    const { ref } = req.params

    try {
        const response = await axios.get(`https://api.paystack.co/transfer/verify/${ref}`, {
            headers: {
                'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`
            }
        })

        return successResponse(res, 'success', response.data.data);
    } catch (error: any) {
        console.log(error);
        return errorResponse(res, 'error', error.response.data.message);
    }
}
