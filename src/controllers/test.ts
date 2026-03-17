import { Request, Response } from 'express';
import { sendPushNotification } from '../services/notification';
// sendPushNotification is still exported for direct push testing
import { sendSMS } from '../services/sms';
import { errorResponse, successResponse, handleResponse } from '../utils/modules';
import { sendOTPEmail } from '../utils/messages';
import { sendEmail } from '../services/gmail';
import prisma from '../config/prisma';
import redis from '../config/redis';

export const sendSMSTest = async (req: Request, res: Response) => {
    const { phone } = req.body;

    const status = await sendSMS(phone, '123456')

    return successResponse(res, 'OTP sent successfully', { smsSendStatus: status })
}

export const sendEmailTest = async (req: Request, res: Response) => {
    const { email } = req.body;

    const verifyEmailMsg = sendOTPEmail('123456');

    const messageId = await sendEmail(
        email,
        verifyEmailMsg.title,
        verifyEmailMsg.body,
        'User'
    )

    let emailSendStatus = Boolean(messageId);

    return successResponse(res, 'OTP sent successfully', { emailSendStatus, messsageId: messageId })
}


export const testNotification = async (req: Request, res: Response) => {
    try {
        const { token, title, message, data } = req.body;

        if (!title || !message || !token) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const response = await sendPushNotification(token, title, message, data)

        return successResponse(res, 'Notification sent successfully', { response });

    } catch (error) {
        console.log(error);
        return errorResponse(res, 'Error sending notification', error);
    }
}



export async function findPersonsNearby(req: Request, res: Response) {
    const { lat, lng, radiusInKm } = req.body;

    const distanceQuery = `
    6371 * acos(
      cos(radians(${lat})) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(latitude))
    )
  `;

    const location: any[] = await prisma.$queryRawUnsafe(`
        SELECT *, (${distanceQuery}) AS distance
        FROM location
        WHERE (${distanceQuery}) <= ${radiusInKm}
        ORDER BY distance ASC
    `);

    return successResponse(res, 'Persons found nearby', { location });
}

export const testRedis = async (req: Request, res: Response) => {
    try {
        await redis.set("testKey", "Redis is working!");

        const value = await redis.get("testKey");

        return successResponse(res, 'success', { status: "ok", message: value })
    } catch (error) {
        return errorResponse(res, 'error', error);
    }
}

export const testGetProfessional = async (req: Request, res: Response) => {
    try {
        const { professionalId } = req.params;

        const professional = await prisma.professional.findUnique({
            where: { id: Number(professionalId) },
            include: {
                profile: { select: { userId: true } }
            }
        })

        if (!professional) {
            return handleResponse(res, 404, false, "Professional not found");
        }

        const ratingAgg = await prisma.rating.aggregate({
            where: { professionalUserId: professional.profile?.userId },
            _avg: { value: true },
            _count: { value: true }
        });

        return successResponse(res, 'success', {
            ...professional,
            avgRating: ratingAgg._avg.value ?? 0,
            numRating: ratingAgg._count.value ?? 0
        });
    } catch (error: any) {
        return errorResponse(res, 'error', error)
    }
}