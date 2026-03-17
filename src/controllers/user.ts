import { Request, Response } from 'express'
import prisma from '../config/prisma'
import { errorResponse, successResponse } from '../utils/modules'

export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { profile: true }
        })

        if (user) {
            (user as any).password = null;
        }

        return successResponse(res, 'success', user);
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}