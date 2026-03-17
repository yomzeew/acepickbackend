import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { errorResponse, successResponse } from "../../utils/modules";
import { z } from "zod";

const vehicleTypes = ['bike', 'car', 'truck', 'keke', 'bus'] as const;

const createPricingSchema = z.object({
    vehicleType: z.enum(vehicleTypes),
    baseCost: z.number().min(0, 'Base cost must be >= 0'),
    costPerKm: z.number().min(0, 'Cost per km must be >= 0'),
    costPerKg: z.number().min(0, 'Cost per kg must be >= 0').optional().default(0),
});

const updatePricingSchema = z.object({
    baseCost: z.number().min(0, 'Base cost must be >= 0').optional(),
    costPerKm: z.number().min(0, 'Cost per km must be >= 0').optional(),
    costPerKg: z.number().min(0, 'Cost per kg must be >= 0').optional(),
});

export const getDeliveryPricingList = async (_req: Request, res: Response) => {
    try {
        const pricing = await prisma.deliveryPricing.findMany({
            orderBy: { vehicleType: 'asc' },
        });

        return successResponse(res, 'success', pricing);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
};

export const getDeliveryPricingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pricing = await prisma.deliveryPricing.findUnique({ where: { id: Number(id) } });

        if (!pricing) {
            return errorResponse(res, 'error', 'Delivery pricing not found');
        }

        return successResponse(res, 'success', pricing);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
};

export const createDeliveryPricing = async (req: Request, res: Response) => {
    try {
        const result = createPricingSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }

        const existing = await prisma.deliveryPricing.findFirst({
            where: { vehicleType: result.data.vehicleType as any },
        });

        if (existing) {
            return res.status(400).json({ message: `Pricing for ${result.data.vehicleType} already exists. Use update instead.` });
        }

        const pricing = await prisma.deliveryPricing.create({
            data: {
                vehicleType: result.data.vehicleType as any,
                baseCost: result.data.baseCost,
                costPerKm: result.data.costPerKm,
                costPerKg: result.data.costPerKg,
            },
        });

        return successResponse(res, 'Delivery pricing created successfully', pricing);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
};

export const updateDeliveryPricing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = updatePricingSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.error.issues[0].message });
        }

        const existing = await prisma.deliveryPricing.findUnique({ where: { id: Number(id) } });

        if (!existing) {
            return errorResponse(res, 'error', 'Delivery pricing not found');
        }

        const updated = await prisma.deliveryPricing.update({
            where: { id: Number(id) },
            data: result.data,
        });

        return successResponse(res, 'Delivery pricing updated successfully', updated);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
};

export const deleteDeliveryPricing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.deliveryPricing.findUnique({ where: { id: Number(id) } });

        if (!existing) {
            return errorResponse(res, 'error', 'Delivery pricing not found');
        }

        await prisma.deliveryPricing.delete({ where: { id: Number(id) } });

        return successResponse(res, 'Delivery pricing deleted successfully', null);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error occurred');
    }
};
