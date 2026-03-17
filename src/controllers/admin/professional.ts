import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { handleResponse, successResponse } from '../../utils/modules';
import { UserStatus } from '../../utils/enum';
import { deactivatedUserEmail, reactivatedUserEmail, suspendedUserEmail } from '../../utils/messages';
import { sendEmail } from '../../services/gmail';

export const deactivateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return handleResponse(res, 404, false, 'User not found');
        }

        if (user.status !== UserStatus.ACTIVE) {
            return handleResponse(res, 400, false, 'Only active users can be deactivated');
        }

        const updated = await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.INACTIVE as any } });

        //send email to user notifying them of deactivation
        const emailMsg = deactivatedUserEmail(updated);

        const { messageId, success } = await sendEmail(
            updated.email,
            emailMsg.title,
            emailMsg.body,
            'User'
        )

        return successResponse(res, 'success', { response: 'User deactivated successfully', emailSent: success, messageId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const suspendUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return handleResponse(res, 404, false, 'User not found');
        }

        if (user.status !== UserStatus.ACTIVE) {
            return handleResponse(res, 400, false, 'Only active users can be suspended');
        }

        const updated = await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED as any } });

        //send email to user notifying them of suspension
        const emailMsg = suspendedUserEmail(updated);

        const { messageId, success } = await sendEmail(
            updated.email,
            emailMsg.title,
            emailMsg.body,
            'User'
        )

        return successResponse(res, 'success', { response: 'User suspended successfully', emailSent: success, messageId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


export const reactivateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return handleResponse(res, 404, false, 'User not found');
        }

        if (user.status === UserStatus.ACTIVE) {
            return handleResponse(res, 400, false, 'User is already active');
        }

        const updated = await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE as any } });

        //send email to user notifying them of reactivation
        const emailMsg = reactivatedUserEmail(updated);

        const { messageId, success } = await sendEmail(
            updated.email,
            emailMsg.title,
            emailMsg.body,
            'User'
        )

        return successResponse(res, 'success', { response: 'User suspended successfully', emailSent: success, messageId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
