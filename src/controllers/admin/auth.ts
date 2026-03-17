import { Request, Response } from 'express'
import prisma from '../../config/prisma';
import { errorResponse, handleResponse, successResponse } from '../../utils/modules';
import { UserRole } from '../../utils/enum';

export const upgradeUserToAdmin = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user)
            return handleResponse(res, 404, false, "User not found")

        if (user.role === UserRole.ADMIN)
            return handleResponse(res, 400, false, "User is already an admin")

        await prisma.user.update({ where: { id: userId }, data: { role: UserRole.ADMIN as any } });

        return successResponse(res, 'success', 'User upgraded to admin');
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error upgrading user to admin')
    }
}


export const removeAdmin = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user)
            return handleResponse(res, 404, false, "User not found")

        if (user.role !== UserRole.ADMIN)
            return handleResponse(res, 400, false, "User is not an admin")

        await prisma.user.update({ where: { id: userId }, data: { role: UserRole.CLIENT as any } });

        return successResponse(res, 'success', 'User removed from admin status')
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error removing admin status')
    }
}


export const getAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await prisma.user.findMany({
            where: { role: UserRole.ADMIN as any },
            include: { profile: true }
        })

        return successResponse(res, 'success', admins)
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Error getting admins')
    }
}