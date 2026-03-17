import { Request, Response } from "express";
import { commissionSchema, updateCommissionSchema } from "../../validation/body";
import prisma from "../../config/prisma";
import { errorResponse, handleResponse, successResponse } from "../../utils/modules";

export const createCommission = async (req: Request, res: Response) => {
    try {
        const result = commissionSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }

        const newCommission = await prisma.commission.create({ data: result.data as any });

        return successResponse(res, 'success', newCommission);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
}

export const getCommissions = async (req: Request, res: Response) => {
    try {
        const commission = await prisma.commission.findMany();

        return successResponse(res, 'success', commission);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
}

export const getCommissionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const commission = await prisma.commission.findUnique({ where: { id: Number(id) } });

        return successResponse(res, 'success', commission);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
}

export const updateCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = updateCommissionSchema.safeParse(req.body);

        if (!result.success) {
            return errorResponse(res, 'error', result.error.issues[0].message);
        }

        const existing = await prisma.commission.findUnique({ where: { id: Number(id) } });

        if (!existing) {
            return errorResponse(res, 'error', 'No commission found');
        }

        await prisma.commission.update({ where: { id: Number(id) }, data: result.data as any });

        return successResponse(res, 'success', 'Commission updated successfully');
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
}

export const deleteCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.commission.findUnique({ where: { id: Number(id) } });

        if (!existing) {
            return errorResponse(res, 'error', 'No commission found');
        }

        await prisma.commission.delete({ where: { id: Number(id) } });

        return successResponse(res, 'success', 'Commission deleted successfully');
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
}

export const toggleCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const commission = await prisma.commission.findUnique({ where: { id: Number(id) } });

        if (!commission) {
            return handleResponse(res, 404, false, 'No commission found')
        }

        const updated = await prisma.commission.update({
            where: { id: Number(id) },
            data: { active: !commission.active }
        });

        return successResponse(res, 'success', { active: updated.active });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred')
    }
}