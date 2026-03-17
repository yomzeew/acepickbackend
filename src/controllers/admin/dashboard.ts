import { Request, Response } from "express"
import prisma from "../../config/prisma";
import { OrderStatus, TransactionStatus, TransactionType, UserRole } from "../../utils/enum";
import { errorResponse, successResponse, nestFlatKeys } from "../../utils/modules";
import { activitySchema } from "../../validation/query";
import z from "zod";

export const overviewStat = async (req: Request, res: Response) => {

    try {
        const totalUsers = await prisma.user.count();

        const clients = await prisma.user.count({ where: { role: UserRole.CLIENT as any } })

        const professionals = await prisma.user.count({ where: { role: UserRole.PROFESSIONAL as any } })

        const riders = await prisma.user.count({ where: { role: UserRole.DELIVERY as any } })

        const corperates = await prisma.user.count({ where: { role: UserRole.CORPERATE as any } })

        const admins = await prisma.user.count({ where: { role: UserRole.ADMIN as any } })

        const activeOrders = await prisma.order.count({
            where: {
                status: { notIn: [OrderStatus.CONFIRM_DELIVERY as any, OrderStatus.CANCELLED as any] }
            }
        });

        const activeDeliveries = await prisma.order.count({
            where: {
                status: { notIn: [OrderStatus.PAID as any, OrderStatus.CONFIRM_DELIVERY as any, OrderStatus.CANCELLED as any] }
            }
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenueAgg = await prisma.transaction.aggregate({
            where: {
                status: TransactionStatus.SUCCESS as any,
                type: TransactionType.CREDIT as any,
                createdAt: { gte: startOfMonth, lte: new Date() }
            },
            _sum: { amount: true }
        });

        const monthlyRevenue = monthlyRevenueAgg._sum.amount ? Number(monthlyRevenueAgg._sum.amount) : 0;

        return successResponse(res, 'success', {
            totalUsers,
            clients,
            professionals,
            riders,
            corperates,
            admins,
            activeOrders,
            activeDeliveries,
            monthlyRevenue
        })
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Internal Server Error')
    }
}

export const getActivities = async (req: Request, res: Response) => {
    const result = activitySchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { page, limit, search, type, status } = result.data;

    try {
        const where: any = {};
        if (type) where.type = type;
        if (status && status !== 'all') where.status = status;
        if (search) {
            where.OR = [
                { type: { contains: search } },
                { action: { contains: search } },
            ];
        }

        const [activities, count] = await Promise.all([
            prisma.activity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.activity.count({ where })
        ]);

        return successResponse(res, 'success', { rows: activities, count, page, limit })
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Something went wrong')
    }
}


function wilsonScore(
    avgRating: number,
    numRatings: number,
    maxRating: number = 5,
    confidence: number = 0.95
): number {
    if (numRatings === 0) return 0;

    const p = avgRating / maxRating;

    const z = confidence === 0.95 ? 1.96 : 1.64;
    const n = numRatings;

    const numerator =
        p +
        (z * z) / (2 * n) -
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

    const denominator = 1 + (z * z) / n;

    return numerator / denominator * maxRating;
}



export const getTopPerformers = async (req: Request, res: Response) => {
    const result = z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(10),
    }).safeParse(req.query)

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { page, limit } = result.data;

    try {
        const topPerformers: any[] = await prisma.$queryRawUnsafe(`
            WITH rating_stats AS (
              SELECT 
                "professionalUserId",
                AVG(value) AS "avgValue",
                COUNT(*) AS "numRatings"
              FROM rating
              GROUP BY "professionalUserId"
            )
            SELECT 
              u.id,
              u.email,
              u.phone,
              u.status,
              u.role,
              u.agreed,
              u."createdAt",
              u."updatedAt",
          
              p.id AS "profile.id",
              p."firstName" AS "profile.firstName",
              p."lastName" AS "profile.lastName",
              p."fcmToken" AS "profile.fcmToken",
              p.avatar AS "profile.avatar",
              p."birthDate" AS "profile.birthDate",
              p.verified AS "profile.verified",
              p.notified AS "profile.notified",
              p."totalJobs" AS "profile.totalJobs",
              p."totalExpense" AS "profile.totalExpense",
              p.rate AS "profile.rate",
              p."totalJobsDeclined" AS "profile.totalJobsDeclined",
              p."totalJobsPending" AS "profile.totalJobsPending",
              p.count AS "profile.count",
              p."totalJobsOngoing" AS "profile.totalJobsOngoing",
              p."totalJobsCompleted" AS "profile.totalJobsCompleted",
              p."totalReview" AS "profile.totalReview",
              p."totalJobsApproved" AS "profile.totalJobsApproved",
              p."totalJobsCanceled" AS "profile.totalJobsCanceled",
              p."totalDisputes" AS "profile.totalDisputes",
              p.bvn AS "profile.bvn",
              p."bvnVerified" AS "profile.bvnVerified",
              p.switch AS "profile.switch",
              p.store AS "profile.store",
              p.position AS "profile.position",
              p."userId" AS "profile.userId",
              p."createdAt" AS "profile.createdAt",
              p."updatedAt" AS "profile.updatedAt",
          
              COALESCE(ROUND(rs."avgValue"::numeric, 1), 0) AS "avgRating",
              COALESCE(rs."numRatings", 0) AS "numRatings",
          
              (
                (
                  ( (COALESCE(rs."avgValue", 0) / 5)
                    + (POW(1.96,2) / (2 * rs."numRatings"))
                    - 1.96 * SQRT((
                        ( (COALESCE(rs."avgValue", 0) / 5)
                          * (1 - (COALESCE(rs."avgValue", 0) / 5))
                        + POW(1.96,2) / (4 * rs."numRatings")
                      ) / rs."numRatings"))
                  ) / (1 + POW(1.96,2)/rs."numRatings")
                ) * 5
              ) AS "wilsonScore"
          
            FROM users u
            LEFT JOIN profiles p ON u.id = p."userId"
            LEFT JOIN rating_stats rs ON rs."professionalUserId" = u.id
            WHERE u.role IN ('professional', 'delivery')
            ORDER BY "wilsonScore" DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `);


        const nestedData = topPerformers.map(nestFlatKeys);

        return successResponse(res, 'success', nestedData)
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Something went wrong')
    }
}