import { Request, Response } from "express"
import prisma from "../config/prisma";
import { errorResponse, handleResponse, successResponse } from "../utils/modules";
import { updateUserProfileSchema } from "../validation/body";
import { getUsersQuerySchema } from "../validation/query";

const fullProfileInclude = {
    user: {
        select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            role: true,
            agreed: true,
            createdAt: true,
            updatedAt: true,
            location: true,
            wallet: {
                select: {
                    id: true,
                    previousBalance: true,
                    currentBalance: true,
                    currency: true,
                    status: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                    pin: true,
                }
            },
            rider: true,
        }
    },
    professional: {
        include: {
            profession: {
                include: { sector: true }
            }
        }
    },
    cooperation: true,
    education: true,
    certifications: true,
    experience: true,
    portfolios: true,
};

export const MyAccountInfo = async (req: Request, res: Response) => {
    const { id } = req.user;
    try {
        const profile = await prisma.profile.findFirst({
            where: { userId: id },
            include: fullProfileInclude,
        })

        if (!profile) return errorResponse(res, "Failed", { status: false, message: "Profile Does'nt exist" })

        const walletPin = profile.user?.wallet?.pin;
        const result = {
            ...profile,
            user: {
                ...profile.user,
                wallet: profile.user?.wallet ? {
                    ...profile.user.wallet,
                    pin: undefined,
                    isActive: walletPin !== null
                } : null
            }
        };

        return successResponse(res, "Successful", result)
    } catch (error: any) {
        return errorResponse(res, "Failed", { error: error?.message })
    }
};


export const UserAccountInfo = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const profile = await prisma.profile.findFirst({
            where: { userId: userId },
            include: fullProfileInclude,
        })

        if (!profile) return errorResponse(res, "Failed", { status: false, message: "Profile Does'nt exist" })

        const walletPin = profile.user?.wallet?.pin;
        const result = {
            ...profile,
            user: {
                ...profile.user,
                wallet: profile.user?.wallet ? {
                    ...profile.user.wallet,
                    pin: undefined,
                    isActive: walletPin !== null
                } : null
            }
        };

        return successResponse(res, "Successful", result)
    } catch (error: any) {
        return errorResponse(res, "Failed", { error: error?.message || "Unknown error" })
    }
};


export const updateProfile = async (req: Request, res: Response) => {
    let { id, role } = req.user;

    const result = updateUserProfileSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { contact, bio, location } = result.data;

    try {
        // console.log(req.user);

        if (bio) {
            await prisma.profile.updateMany({
                where: { userId: id },
                data: bio
            });
        }

        if (contact) {
            await prisma.user.update({
                where: { id },
                data: contact
            });
        }

        if (location) {
            const existingLocation = await prisma.location.findFirst({ where: { userId: id } });
            if (existingLocation) {
                await prisma.location.update({
                    where: { id: existingLocation.id },
                    data: location
                });
            } else {
                await prisma.location.create({
                    data: { ...location, userId: id }
                });
            }
        }

        return successResponse(res, "success", "Profile updated successfully");
    } catch (error: any) {
        console.error("Profile update error:", error?.message || error);
        return errorResponse(res, "Failed", error?.message || error)
    }
}

export const getUsers = async (req: Request, res: Response) => {
    const { id, role: userRole } = req.user;

    const result = getUsersQuerySchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    console.log(result.data);

    const { search, professionId, page, limit, role } = result.data;

    // Enforce chat role restrictions:
    // Client → can see professional + delivery
    // Professional → can see client only
    // Delivery → can see client only
    const allowedRolesMap: Record<string, string[]> = {
        client: ['professional', 'delivery'],
        professional: ['client'],
        delivery: ['client'],
    };
    const allowedRoles = allowedRolesMap[userRole] || ['client', 'professional', 'delivery'];

    // If a specific role filter is requested, validate it's in the allowed list
    const effectiveRole = role
        ? (allowedRoles.includes(role) ? role : '__none__')  // block disallowed role filter
        : undefined;

    try {
        const contacts = await prisma.user.findMany({
            where: {
                ...(effectiveRole ? { role: effectiveRole as any } : { role: { in: allowedRoles as any } }),
                id: { not: id },
                profile: search
                    ? {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' as const } },
                            { lastName: { contains: search, mode: 'insensitive' as const } },
                        ],
                    }
                    : undefined,
                ...(professionId && {
                    profile: {
                        ...(search ? {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' as const } },
                                { lastName: { contains: search, mode: 'insensitive' as const } },
                            ],
                        } : {}),
                        professional: {
                            professionId: Number(professionId),
                        },
                    },
                }),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
                agreed: true,
                fcmToken: true,
                createdAt: true,
                updatedAt: true,
                profile: {
                    include: {
                        professional: {
                            include: {
                                profession: true,
                            },
                        },
                    },
                },
                location: true,
                onlineUser: true,
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
        });


        return successResponse(res, 'success', contacts)
    } catch (error) {
        console.log(error)
        return errorResponse(res, "Failed", error)
    }
}