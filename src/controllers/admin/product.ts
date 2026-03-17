import { Request, Response } from "express";
import { z } from "zod";
import { getProductSchema } from "../../validation/query";
import { errorResponse, handleResponse, successResponse } from "../../utils/modules";
import prisma from "../../config/prisma";
import { NotificationService } from "../../services/notification";
import { approveProductEmail, rejectProductEmail } from "../../utils/messages";
import { sendEmail } from "../../services/gmail";
import { OrderStatus, ProductTransactionStatus, TransactionStatus, NotificationType } from "../../utils/enum";

export const getProducts = async (req: Request, res: Response) => {
    const result = getProductSchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { approved, categoryId, category, search, state, lga, locationId, page, limit, orderBy, orderDir } = result.data;

    try {
        const where: any = {};
        if (approved !== undefined) where.approved = approved;
        if (categoryId) where.categoryId = categoryId;
        if (search) where.name = { contains: search };
        if (locationId) where.locationId = locationId;

        const categoryWhere: any = {};
        if (category) categoryWhere.name = { contains: category };

        const locationWhere: any = {};
        if (state) locationWhere.state = { contains: state };
        if (lga) locationWhere.lga = { contains: lga };

        const [products, count] = await Promise.all([
            prisma.product.findMany({
                where: {
                    ...where,
                    category: Object.keys(categoryWhere).length ? categoryWhere : undefined,
                    pickupLocation: Object.keys(locationWhere).length ? locationWhere : undefined,
                },
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    category: { select: { id: true, name: true, description: true } },
                    pickupLocation: true,
                },
                orderBy: { [orderBy || 'createdAt']: (orderDir || 'desc').toLowerCase() as any }
            }),
            prisma.product.count({
                where: {
                    ...where,
                    category: Object.keys(categoryWhere).length ? categoryWhere : undefined,
                    pickupLocation: Object.keys(locationWhere).length ? locationWhere : undefined,
                }
            })
        ]);

        return successResponse(res, 'success', {
            products: products.map((product: any) => ({
                ...product,
                images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images,
            })),
            page,
            limit,
            total: count
        });

    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Failed to retrieve products');
    }
}

export const approveProducts = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(req.params.productId) },
            include: { user: { include: { profile: true } } }
        });

        if (!product) {
            return handleResponse(res, 404, false, 'Product not found')
        }

        if (product.approved) {
            return handleResponse(res, 400, false, 'Product already approved')
        }

        await prisma.product.update({ where: { id: product.id }, data: { approved: true } });

        const prod: any = product;

        const email = approveProductEmail(prod);

        const { success } = await sendEmail(
            prod.user.email,
            email.title,
            email.body,
            prod.user.profile?.firstName
        )

        await NotificationService.create({
            userId: prod.userId,
            type: NotificationType.SYSTEM,
            title: 'Product Approved',
            message: `Your product "${prod.name}" has been approved by admin`,
            data: { productId: prod.id },
        });

        return successResponse(res, 'success', { message: 'Product approved successfully', emailSentStatus: success });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Failed to approve product')
    }
}


export const rejectProducts = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(req.params.productId) },
            include: { user: { include: { profile: true } } }
        });

        if (!product) {
            return handleResponse(res, 404, false, 'Product not found')
        }

        if (product.approved === false) {
            return handleResponse(res, 400, false, 'Product already rejected')
        }

        await prisma.product.update({ where: { id: product.id }, data: { approved: false } });

        const prod: any = product;

        const email = rejectProductEmail(prod);

        const { success } = await sendEmail(
            prod.user.email,
            email.title,
            email.body,
            prod.user.profile?.firstName
        )

        await NotificationService.create({
            userId: prod.userId,
            type: NotificationType.SYSTEM,
            title: 'Product Rejected',
            message: `Your product "${prod.name}" has been rejected by admin`,
            data: { productId: prod.id },
        });

        return successResponse(res, 'success', { message: 'Product rejected successfully', emailSentStatus: success });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Failed to reject product')
    }
}

export const marketOversight = async (req: Request, res: Response) => {
    try {
        const totalProducts = await prisma.product.count();
        const pendingProducts = await prisma.product.count({ where: { approved: null } });
        const approvedProducts = await prisma.product.count({ where: { approved: true } });
        const rejectedProducts = await prisma.product.count({ where: { approved: false } });
        const totalTransactions = await prisma.transaction.count({ where: { status: TransactionStatus.SUCCESS as any } });
        const disputedProducts = await prisma.productTransaction.count({ where: { status: ProductTransactionStatus.DISPUTED as any } });

        return successResponse(res, 'success', {
            totalProducts,
            approvedProducts,
            rejectedProducts,
            pendingProducts,
            totalTransactions
        });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal Server Error');
    }
}


export const deliveryOversight = async (req: Request, res: Response) => {
    try {
        const totalDeliveries = await prisma.order.count();
        const unassignedDeliveries = await prisma.order.count({ where: { status: OrderStatus.PAID as any } });
        const assignedDeliveries = await prisma.order.count({ where: { status: OrderStatus.ACCEPTED as any } });
        const pickedUpDevliveries = await prisma.order.count({ where: { status: OrderStatus.CONFIRM_PICKUP as any } });
        const completedDeliveries = await prisma.order.count({ where: { status: OrderStatus.CONFIRM_DELIVERY as any } });
        const disputedDeliveries = await prisma.order.count({ where: { status: OrderStatus.DISPUTED as any } });

        return successResponse(res, 'success', {
            totalDeliveries,
            unassignedDeliveries,
            assignedDeliveries,
            pickedUpDevliveries,
            completedDeliveries,
            disputedDeliveries
        });
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal Server Error');
    }
}