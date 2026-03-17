import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { errorResponse, handleResponse, successResponse } from "../utils/modules";


export const getClient = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
                agreed: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
                location: true,
            },
        })

        if (!user) return handleResponse(res, 404, false, "Client not found")

        return successResponse(res, "success", user)
    } catch (error) {
        return errorResponse(res, "error", error)
    }
}
