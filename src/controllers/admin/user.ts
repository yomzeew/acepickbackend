import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { UserRole, UserStatus } from "../../utils/enum";
import { errorResponse, handleResponse, successResponse } from "../../utils/modules";
import { reactivateUserEmail, suspendUserEmail } from "../../utils/messages";
import { sendEmail } from "../../services/gmail";
import { z } from "zod";

export const getAllUsers = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { role } = req.params;
    const result = z.object({
        role: z.nativeEnum(UserRole),
    }).safeParse(req.params);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid role",
            details: result.error.flatten().fieldErrors,
        });
    }

    try {
        const clients = await prisma.user.findMany({
            where: { role: role as any },
            include: { profile: true },
            orderBy: { createdAt: 'desc' }
        });

        // Exclude password from results
        const sanitized = clients.map((u: any) => { u.password = null; return u; });

        return successResponse(res, 'success', sanitized)
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Internal server error')
    }
}

export const toggleSuspension = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });

        if (!user) {
            return handleResponse(res, 404, false, 'User not found');
        }

        if (user.status === UserStatus.ACTIVE) {
            await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED as any } });

            const email = suspendUserEmail(user);

            await sendEmail(
                user.email,
                email.title,
                email.body,
                user.profile?.firstName || 'User'
            )

            return successResponse(res, 'success', 'User suspended successfully')
        } else {
            await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE as any } });

            const email = reactivateUserEmail(user);

            await sendEmail(
                user.email,
                email.title,
                email.body,
                user.profile?.firstName || 'User'
            )

            return successResponse(res, 'success', 'User reactivated successfully')
        }
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
}

export const emailUser = async (req: Request, res: Response) => {
    const { userId, title, body } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });

        if (!user) {
            return handleResponse(res, 404, false, 'User not found')
        }

        const { success, error } = await sendEmail(
            user.email,
            title,
            body,
            user.profile?.firstName || 'User'
        )

        if (success) {
            return handleResponse(res, 200, true, 'Email sent successfully')
        }

        throw error
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'An error ocurred');
    }
}