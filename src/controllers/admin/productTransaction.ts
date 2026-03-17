import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { errorResponse, successResponse } from "../../utils/modules";

export const getProductTransactions = async (req: Request, res: Response) => {
    try {
        const productTransactions = await prisma.productTransaction.findMany();

        return successResponse(res, 'success', productTransactions);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal Server Error')
    }
}