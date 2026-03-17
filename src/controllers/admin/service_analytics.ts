import { Request, Response } from "express"
import prisma from "../../config/prisma";
import { JobStatus, OrderStatus } from "../../utils/enum";
import { errorResponse, successResponse } from "../../utils/modules";

export const getJobStats = async (req: Request, res: Response) => {
    console.log("Fetching job statistics...");
    try {
        const totalJobs = await prisma.job.count();
        const pendingJobs = await prisma.job.count({ where: { status: JobStatus.PENDING as any } });
        const ongoingJobs = await prisma.job.count({ where: { status: JobStatus.ONGOING as any } });
        const completedJobs = await prisma.job.count({ where: { status: JobStatus.COMPLETED as any } });
        const rejectedJobs = await prisma.job.count({ where: { status: JobStatus.REJECTED as any } });
        const approvedJobs = await prisma.job.count({ where: { status: JobStatus.APPROVED as any } });
        const disputedJobs = await prisma.job.count({ where: { status: JobStatus.DISPUTED as any } });

        return successResponse(res, 'success', {
            totalJobs,
            pendingJobs,
            ongoingJobs,
            completedJobs,
            rejectedJobs,
            approvedJobs,
            disputedJobs,
        });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error')
    }
}

export const avgRating = async (req: Request, res: Response) => {
    try {
        const ratingAgg = await prisma.rating.aggregate({
            _avg: { value: true }
        });

        const avg = ratingAgg._avg.value;

        if (!avg) {
            return successResponse(res, 'success', { avgRating: 0 });
        }

        return successResponse(res, 'success', { avgRating: parseFloat(Number(avg).toFixed(2)) });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
}

export const getOrderStats = async (req: Request, res: Response) => {
    try {
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { status: OrderStatus.PENDING as any } });
        const acceptedOrders = await prisma.order.count({ where: { status: OrderStatus.ACCEPTED as any } });
        const paidOrders = await prisma.order.count({ where: { status: OrderStatus.PAID as any } });
        const pickedUpOrders = await prisma.order.count({ where: { status: OrderStatus.PICKED_UP as any } });
        const inTransitOrders = await prisma.order.count({ where: { status: OrderStatus.IN_TRANSIT as any } });
        const deliveredOrders = await prisma.order.count({ where: { status: OrderStatus.DELIVERED as any } });
        const confirmedDeliveryOrders = await prisma.order.count({ where: { status: OrderStatus.CONFIRM_DELIVERY as any } });
        const cancelledOrders = await prisma.order.count({ where: { status: OrderStatus.CANCELLED as any } });

        return successResponse(res, 'success', {
            totalOrders,
            pendingOrders,
            paidOrders,
            acceptedOrders,
            pickedUpOrders,
            inTransitOrders,
            deliveredOrders,
            confirmedDeliveryOrders,
            cancelledOrders,
        })
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
} 