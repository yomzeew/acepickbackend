import { Request, Response } from "express";
import prisma from "../config/prisma";
import { successResponse, errorResponse } from '../utils/modules'

export const getAllTransactions = async (req: Request, res: Response) => {
    const { id, role } = req.user;

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: id },
            include: { job: true },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', transactions)
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const getTransactionById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const transaction = await prisma.transaction.findUnique({ where: { id: Number(id) } })

        if (!transaction) {
            return errorResponse(res, 'error', 'Transaction not found')
        }

        return successResponse(res, 'success', transaction)
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

