import { Request, Response } from "express";
import prisma from '../config/prisma';
import { errorResponse, handleResponse, successResponse } from "../utils/modules";
import { portfolioSchema, updatePortfolioSchema } from "../validation/body";


export const getPortfolios = async (req: Request, res: Response) => {
    const { id } = req.user;

    try {
        const profile = await prisma.profile.findFirst({ where: { userId: id } });

        if (!profile) {
            return handleResponse(res, 404, false, 'Profile not found')
        }

        const portfolios = await prisma.portfolio.findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, 'success', portfolios);
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const addPortfolio = async (req: Request, res: Response) => {
    const { id } = req.user;

    const result = portfolioSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { title, description, duration, date, file } = result.data;

    try {
        const profile = await prisma.profile.findFirst({ where: { userId: id } });

        if (!profile) {
            return handleResponse(res, 404, false, 'Profile not found')
        }

        const portfolio = await prisma.portfolio.create({
            data: {
                title,
                description,
                duration,
                date,
                file,
                profileId: profile.id
            }
        });

        return successResponse(res, 'success', portfolio);
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const updatePortfolio = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return handleResponse(res, 400, false, 'Provide an id')
    }

    const result = updatePortfolioSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    try {
        const updated = await prisma.portfolio.update({
            where: { id: Number(id) },
            data: result.data
        })

        return successResponse(res, 'success', updated);
    } catch (error) {
        return errorResponse(res, 'error', error)
    }
}

export const deletePortfolio = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return handleResponse(res, 400, false, 'Provide an id')
    }

    try {
        await prisma.portfolio.delete({
            where: { id: Number(id) }
        })

        return successResponse(res, 'success', { message: 'Portfolio deleted successfully' });
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}