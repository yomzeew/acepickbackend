import { Request, Response } from "express";
import { addReviewSchema } from "../validation/body";
import prisma from "../config/prisma";
import { JobStatus, OrderStatus, UserRole } from "../utils/enum";
import { errorResponse, handleResponse, successResponse } from "../utils/modules";
import { z } from "zod";

export const giveReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;

        const result = addReviewSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                error: result.error.format()
            })
        }

        const { review, jobId, orderId } = result.data

        let user: any;
        let job: any;
        let order: any;

        if (jobId) {
            const existingReview = await prisma.review.findFirst({
                where: { jobId, clientUserId: id }
            })

            if (existingReview) {
                return handleResponse(res, 400, false, 'You have already reviewed this job')
            }

            job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { professional: true }
            })

            if (!job) {
                return handleResponse(res, 404, false, "Job not found");
            }

            if (job.status !== JobStatus.APPROVED) {
                return handleResponse(res, 400, false, "You can only review approved jobs");
            }

            if (job.clientId != id) {
                return handleResponse(res, 403, false, "You are not authorized to review this job");
            }

            user = job.professional;
        }

        if (orderId) {
            const existingReview = await prisma.review.findFirst({
                where: { orderId, clientUserId: id }
            })

            if (existingReview) {
                return handleResponse(res, 400, false, 'You have already reviewed this order')
            }

            order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    rider: true,
                    productTransaction: true
                }
            })

            if (!order) {
                return handleResponse(res, 404, false, "Order not found");
            }

            if (order.status !== OrderStatus.CONFIRM_DELIVERY) {
                return handleResponse(res, 400, false, "You can only review orders that have been confirmed as delivered");
            }

            if (order.productTransaction.buyerId != id) {
                return handleResponse(res, 403, false, "You are not authorized to review this order");
            }

            user = order.rider;
        }

        if (!user) {
            return handleResponse(res, 404, false, "User not found");
        }

        if (!(user.role === UserRole.PROFESSIONAL || user.role === UserRole.DELIVERY)) {
            return handleResponse(res, 400, false, "User is neither a professional nor delivery");
        }


        const reviewObj = await prisma.review.create({
            data: {
                text: review,
                professionalUserId: user.id,
                clientUserId: id,
                ...(user.role === UserRole.DELIVERY ? { orderId } : {}),
                ...(user.role === UserRole.PROFESSIONAL ? { jobId } : {})
            }
        });


        return successResponse(res, 'success', { reviewObj })
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', "Internal server error")
    }
}

export const editReview = async (req: Request, res: Response) => {
    try {
        const { reviewId } = req.params;
        const { id } = req.user;

        const result = z.object({
            review: z.string().min(1)
        }).safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                error: result.error.format()
            })
        }

        const { review } = result.data;

        const reviewObj = await prisma.review.findUnique({ where: { id: BigInt(reviewId) } });

        if (!reviewObj) {
            return errorResponse(res, 'error', "Review not found")
        }

        if (reviewObj.clientUserId !== id) {
            return errorResponse(res, 'error', "You are not authorized to edit this review")
        }

        const updated = await prisma.review.update({
            where: { id: BigInt(reviewId) },
            data: { text: review }
        });

        return successResponse(res, 'success', { reviewObj: updated })
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', "Internal server error")
    }
}

export const deleteReview = async (req: Request, res: Response) => {
    try {
        const { reviewId } = req.params;
        const { id } = req.user;

        const reviewObj = await prisma.review.findUnique({ where: { id: BigInt(reviewId) } });

        if (!reviewObj) {
            return errorResponse(res, 'error', "Review not found")
        }

        if (reviewObj.clientUserId !== id) {
            return errorResponse(res, 'error', "You are not authorized to delete this review")
        }

        await prisma.review.delete({ where: { id: BigInt(reviewId) } });

        return successResponse(res, 'success', { message: "Review deleted successfully" })
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', "Internal server error")
    }
}