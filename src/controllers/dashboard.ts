import { Request, Response } from "express";
import prisma from "../config/prisma";
import { errorResponse, successResponse } from "../utils/modules";

/**
 * GET /dashboard/client
 * Aggregated dashboard data for client role
 */
export const getClientDashboard = async (req: Request, res: Response) => {
  const { id } = req.user;

  try {
    const [profile, wallet, jobStats, recentJobs, recentTransactions, recentOrders] =
      await Promise.all([
        // Profile
        prisma.profile.findFirst({
          where: { userId: id },
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            totalJobs: true,
            totalJobsCompleted: true,
            totalJobsPending: true,
            totalJobsOngoing: true,
            totalJobsCanceled: true,
            totalJobsApproved: true,
            totalDisputes: true,
            totalExpense: true,
            totalReview: true,
          },
        }),

        // Wallet
        prisma.wallet.findFirst({
          where: { userId: id },
          select: {
            currentBalance: true,
            previousBalance: true,
            currency: true,
            status: true,
          },
        }),

        // Job counts by status
        prisma.job.groupBy({
          by: ["status"],
          where: { clientId: id },
          _count: { status: true },
        }),

        // Recent 5 jobs
        prisma.job.findMany({
          where: { clientId: id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            payStatus: true,
            total: true,
            mode: true,
            createdAt: true,
            professional: {
              select: {
                id: true,
                profile: {
                  select: { firstName: true, lastName: true, avatar: true },
                },
              },
            },
          },
        }),

        // Recent 5 transactions
        prisma.transaction.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            channel: true,
            currency: true,
            createdAt: true,
          },
        }),

        // Recent 5 product orders (as buyer)
        prisma.productTransaction.findMany({
          where: { buyerId: id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            quantity: true,
            price: true,
            status: true,
            createdAt: true,
            product: {
              select: { id: true, name: true, price: true, images: true },
            },
          },
        }),
      ]);

    // Transform job stats into a map
    const jobCountMap: Record<string, number> = {};
    jobStats.forEach((s) => {
      jobCountMap[s.status] = s._count.status;
    });

    return successResponse(res, "Client dashboard loaded", {
      profile,
      wallet,
      jobSummary: {
        total: Object.values(jobCountMap).reduce((a, b) => a + b, 0),
        pending: jobCountMap["PENDING"] || 0,
        ongoing: jobCountMap["ONGOING"] || 0,
        completed: jobCountMap["COMPLETED"] || 0,
        approved: jobCountMap["APPROVED"] || 0,
        cancelled: jobCountMap["CANCELLED"] || 0,
        disputed: jobCountMap["DISPUTED"] || 0,
      },
      recentJobs,
      recentTransactions,
      recentOrders,
    });
  } catch (error: any) {
    return errorResponse(res, "Failed to load client dashboard", {
      error: error?.message,
    });
  }
};

/**
 * GET /dashboard/professional
 * Aggregated dashboard data for professional role
 */
export const getProfessionalDashboard = async (req: Request, res: Response) => {
  const { id } = req.user;

  try {
    const [
      profile,
      wallet,
      professional,
      jobStats,
      recentJobs,
      ongoingJobs,
      recentTransactions,
      ratingStats,
      recentReviews,
      skills,
    ] = await Promise.all([
      // Profile (includes relations for professional profile settings page)
      prisma.profile.findFirst({
        where: { userId: id },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          verified: true,
          totalJobs: true,
          totalJobsCompleted: true,
          totalJobsPending: true,
          totalJobsOngoing: true,
          totalJobsDeclined: true,
          totalJobsCanceled: true,
          totalJobsApproved: true,
          totalDisputes: true,
          totalExpense: true,
          totalReview: true,
          rate: true,
          education: {
            select: {
              id: true,
              school: true,
              degreeType: true,
              course: true,
              startDate: true,
              gradDate: true,
              isCurrent: true,
            },
            orderBy: { startDate: "desc" },
          },
          experience: {
            select: {
              id: true,
              postHeld: true,
              workPlace: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
            },
            orderBy: { startDate: "desc" },
          },
          certifications: {
            select: {
              id: true,
              title: true,
              companyIssue: true,
              date: true,
              filePath: true,
            },
            orderBy: { date: "desc" },
          },
          portfolios: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              date: true,
              file: true,
            },
            orderBy: { date: "desc" },
          },
        },
      }),

      // Wallet
      prisma.wallet.findFirst({
        where: { userId: id },
        select: {
          currentBalance: true,
          previousBalance: true,
          currency: true,
          status: true,
        },
      }),

      // Professional info (includes rejectedAmount)
      prisma.professional.findFirst({
        where: { profile: { userId: id } },
        select: {
          id: true,
          totalEarning: true,
          completedAmount: true,
          pendingAmount: true,
          rejectedAmount: true,
          availableWithdrawalAmount: true,
          chargeFrom: true,
          yearsOfExp: true,
          available: true,
          workType: true,
          intro: true,
          language: true,
          online: true,
          profession: {
            select: {
              id: true,
              title: true,
              sector: { select: { id: true, title: true } },
            },
          },
          professionalSkills: {
            select: {
              id: true,
              proficiency: true,
              yearsOfExp: true,
              skill: {
                select: { id: true, name: true, category: true },
              },
            },
          },
        },
      }),

      // Job counts by status
      prisma.job.groupBy({
        by: ["status"],
        where: { professionalId: id },
        _count: { status: true },
      }),

      // Recent 5 jobs
      prisma.job.findMany({
        where: { professionalId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          payStatus: true,
          total: true,
          mode: true,
          workmanship: true,
          materialsCost: true,
          accepted: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      }),

      // Ongoing jobs (for "Jobs in Progress" section)
      prisma.job.findMany({
        where: { professionalId: id, status: "ONGOING" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          payStatus: true,
          total: true,
          mode: true,
          workmanship: true,
          materialsCost: true,
          accepted: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      }),

      // Recent 5 transactions
      prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          description: true,
          channel: true,
          currency: true,
          createdAt: true,
        },
      }),

      // Average rating
      prisma.rating.aggregate({
        where: { professionalUserId: id },
        _avg: { value: true },
        _count: { value: true },
      }),

      // Recent 3 reviews
      prisma.review.findMany({
        where: { professionalUserId: id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          text: true,
          createdAt: true,
          clientUser: {
            select: {
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      }),

      // Professional skills
      prisma.professionalSkill.findMany({
        where: { professional: { profile: { userId: id } } },
        select: {
          id: true,
          proficiency: true,
          yearsOfExp: true,
          skill: {
            select: { id: true, name: true, category: true },
          },
        },
      }),
    ]);

    // Transform job stats
    const jobCountMap: Record<string, number> = {};
    jobStats.forEach((s) => {
      jobCountMap[s.status] = s._count.status;
    });

    return successResponse(res, "Professional dashboard loaded", {
      profile,
      wallet,
      professional,
      jobSummary: {
        total: Object.values(jobCountMap).reduce((a, b) => a + b, 0),
        pending: jobCountMap["PENDING"] || 0,
        ongoing: jobCountMap["ONGOING"] || 0,
        completed: jobCountMap["COMPLETED"] || 0,
        approved: jobCountMap["APPROVED"] || 0,
        declined: jobCountMap["DECLINED"] || 0,
        cancelled: jobCountMap["CANCELLED"] || 0,
        disputed: jobCountMap["DISPUTED"] || 0,
      },
      recentJobs,
      ongoingJobs,
      recentTransactions,
      ratings: {
        average: ratingStats._avg.value || 0,
        total: ratingStats._count.value || 0,
      },
      recentReviews,
      skills,
    });
  } catch (error: any) {
    return errorResponse(res, "Failed to load professional dashboard", {
      error: error?.message,
    });
  }
};

/**
 * GET /dashboard/delivery
 * Aggregated dashboard data for delivery role
 */
export const getDeliveryDashboard = async (req: Request, res: Response) => {
  const { id } = req.user;

  try {
    const [
      profile,
      wallet,
      rider,
      orderStats,
      availableOrders,
      pendingDeliveries,
      activeOrders,
      recentOrders,
      recentTransactions,
      ratingStats,
      earningsData,
    ] = await Promise.all([
      // Profile (includes all fields the delivery UI reads)
      prisma.profile.findFirst({
        where: { userId: id },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          totalJobs: true,
          totalJobsCompleted: true,
          totalJobsOngoing: true,
          totalJobsDeclined: true,
          totalJobsCanceled: true,
          totalExpense: true,
          totalReview: true,
        },
      }),

      // Wallet
      prisma.wallet.findFirst({
        where: { userId: id },
        select: {
          currentBalance: true,
          previousBalance: true,
          currency: true,
          status: true,
        },
      }),

      // Rider info
      prisma.rider.findFirst({
        where: { userId: id },
        select: {
          id: true,
          vehicleType: true,
          licenseNumber: true,
          status: true,
        },
      }),

      // Order counts by status
      prisma.order.groupBy({
        by: ["status"],
        where: { riderId: id },
        _count: { status: true },
      }),

      // Count of available paid orders (not yet accepted by any rider)
      prisma.order.count({
        where: {
          status: "paid",
          riderId: null,
        },
      }),

      // Pending deliveries (paid orders waiting for a rider)
      prisma.order.findMany({
        where: {
          status: "paid",
          riderId: null,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          cost: true,
          deliveryFee: true,
          pickupAddress: true,
          deliveryAddress: true,
          distance: true,
          createdAt: true,
          dropoffLocation: {
            select: { latitude: true, longitude: true, address: true, city: true, state: true },
          },
          productTransaction: {
            select: {
              product: {
                select: {
                  name: true,
                  images: true,
                  pickupLocation: {
                    select: { latitude: true, longitude: true, address: true, city: true, state: true },
                  },
                },
              },
              buyer: {
                select: {
                  profile: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      }),

      // Active orders (accepted, picked_up, in_transit)
      prisma.order.findMany({
        where: {
          riderId: id,
          status: { in: ["accepted", "picked_up", "confirm_pickup", "in_transit"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          cost: true,
          deliveryFee: true,
          pickupAddress: true,
          deliveryAddress: true,
          distance: true,
          createdAt: true,
          dropoffLocation: {
            select: { latitude: true, longitude: true, address: true, city: true, state: true },
          },
          productTransaction: {
            select: {
              product: {
                select: {
                  name: true,
                  images: true,
                  pickupLocation: {
                    select: { latitude: true, longitude: true, address: true, city: true, state: true },
                  },
                },
              },
              buyer: {
                select: {
                  profile: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      }),

      // Recent 5 completed/all orders
      prisma.order.findMany({
        where: { riderId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          cost: true,
          deliveryFee: true,
          pickupAddress: true,
          deliveryAddress: true,
          distance: true,
          createdAt: true,
          productTransaction: {
            select: {
              product: {
                select: { name: true, images: true },
              },
            },
          },
        },
      }),

      // Recent 5 transactions
      prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          description: true,
          channel: true,
          currency: true,
          createdAt: true,
        },
      }),

      // Average rating
      prisma.rating.aggregate({
        where: { professionalUserId: id },
        _avg: { value: true },
        _count: { value: true },
      }),

      // Earnings: sum delivery fees from completed orders
      prisma.order.aggregate({
        where: {
          riderId: id,
          status: { in: ["delivered", "confirm_delivery"] },
        },
        _sum: { deliveryFee: true, cost: true },
        _count: { id: true },
      }),
    ]);

    // Transform order stats
    const orderCountMap: Record<string, number> = {};
    orderStats.forEach((s) => {
      orderCountMap[s.status] = s._count.status;
    });

    const totalCompleted =
      (orderCountMap["delivered"] || 0) + (orderCountMap["confirm_delivery"] || 0);
    const totalActive =
      (orderCountMap["accepted"] || 0) +
      (orderCountMap["picked_up"] || 0) +
      (orderCountMap["confirm_pickup"] || 0) +
      (orderCountMap["in_transit"] || 0);
    const totalCancelled = orderCountMap["cancelled"] || 0;

    // Compute earnings for the delivery UI (mirrors professional earnings structure)
    const completedEarnings = Number(earningsData._sum.deliveryFee || 0);
    const pendingEarnings = activeOrders.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 0), 0
    );
    const walletBalance = Number(wallet?.currentBalance || 0);

    // Professional-like earnings object so the frontend can read
    // user?.profile?.professional?.completedAmount etc.
    const professional = {
      completedAmount: completedEarnings,
      pendingAmount: pendingEarnings,
      availableWithdrawalAmount: walletBalance,
      rejectedAmount: 0,
      totalEarning: completedEarnings + pendingEarnings,
    };

    return successResponse(res, "Delivery dashboard loaded", {
      profile,
      wallet,
      rider,
      professional,
      orderSummary: {
        total: Object.values(orderCountMap).reduce((a, b) => a + b, 0),
        active: totalActive,
        completed: totalCompleted,
        cancelled: totalCancelled,
        disputed: orderCountMap["disputed"] || 0,
        availableNearby: availableOrders,
      },
      pendingDeliveries,
      activeOrders,
      recentOrders,
      recentTransactions,
      ratings: {
        average: ratingStats._avg.value || 0,
        total: ratingStats._count.value || 0,
      },
    });
  } catch (error: any) {
    return errorResponse(res, "Failed to load delivery dashboard", {
      error: error?.message,
    });
  }
};
