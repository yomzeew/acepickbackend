import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { TransactionStatus, TransactionType } from "../../utils/enum";
import { errorResponse, successResponse } from "../../utils/modules";
import { getTransactionSchema } from "../../validation/query";

export const transactionStat = async (req: Request, res: Response) => {
    try {
        const totalTransactions = await prisma.transaction.count();
        const successfulTransactions = await prisma.transaction.count({ where: { status: TransactionStatus.SUCCESS as any } });
        const failedTransactions = await prisma.transaction.count({ where: { status: TransactionStatus.FAILED as any } });
        const pendingTransactions = await prisma.transaction.count({ where: { status: TransactionStatus.PENDING as any } });

        const inboundAgg = await prisma.transaction.aggregate({
            where: { type: TransactionType.CREDIT as any, status: TransactionStatus.SUCCESS as any },
            _sum: { amount: true }
        });

        const outboundAgg = await prisma.transaction.aggregate({
            where: { type: TransactionType.DEBIT as any, status: TransactionStatus.SUCCESS as any },
            _sum: { amount: true }
        });

        return successResponse(res, 'success', {
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            pendingTransactions,
            inboundAmount: inboundAgg._sum.amount ? Number(inboundAgg._sum.amount) : 0,
            outboundAmount: outboundAgg._sum.amount ? Number(outboundAgg._sum.amount) : 0
        })
    } catch (error) {
        console.log(error);
        return errorResponse(res, "error", 'Internal Server Error');
    }
}

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const result = getTransactionSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid request data',
                errors: result.error.flatten()
            });
        }

        const { status, page, limit } = result.data;

        const transactions = await prisma.transaction.findMany({
            where: status && status !== 'all' ? { status: status as any } : {},
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, 'success', { transactions });
    } catch (error) {
        console.log(error);
        return errorResponse(res, "error", 'Internal Server Error');
    }
}