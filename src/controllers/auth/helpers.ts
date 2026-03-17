import { Request, Response } from 'express';
import prisma from "../../config/prisma";
import config from "../../config/configSetup";
import { UserRole } from "../../utils/enum";
import { sign } from "jsonwebtoken";

export const generateToken = (user: { id: string; email: string; role: string }) => {
    return sign({ id: user.id, email: user.email, role: user.role }, config.TOKEN_SECRET);
};

export const checkExistingUser = async (email: string, phone: string) => {
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) return "Email already exist";

    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) return "Phone already exist";

    return null;
};

export const checkVerification = async (email: string, phone: string) => {
    const verifiedEmail = await prisma.verify.findFirst({ where: { contact: email, verified: true } });
    const verifiedPhone = await prisma.verify.findFirst({ where: { contact: phone, verified: true } });

    if (!verifiedEmail && !verifiedPhone) return "Email or Phone must be verified";

    return null;
};

export const createWallet = async (userId: string) => {
    return prisma.wallet.create({
        data: { userId, previousBalance: 0, currentBalance: 0 }
    });
};

export const logActivity = async (userId: string, action: string, type: string, status: string = 'success') => {
    // Map string status to enum value
    const statusMap: Record<string, any> = {
        'success': 'act_success',
        'failed': 'act_failed',
        'pending': 'act_pending'
    };
    
    return prisma.activity.create({
        data: { userId, action, type, status: statusMap[status] || 'act_success' }
    });
};

export const sanitizeUserData = (user: any, profile: any, wallet: any, extras?: Record<string, any>) => {
    return {
        ...user,
        password: null,
        profile,
        wallet: wallet ? { ...wallet, pin: null } : null,
        ...extras
    };
};

export const getUserDataByRole = async (userId: string, role: string) => {
    const baseInclude = { wallet: true, location: true };

    let userData: any;

    switch (role) {
        case UserRole.CLIENT:
            userData = await prisma.user.findUnique({
                where: { id: userId },
                include: { ...baseInclude, profile: true }
            });
            break;

        case UserRole.PROFESSIONAL:
            userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    ...baseInclude,
                    profile: {
                        include: {
                            professional: {
                                include: { profession: { include: { sector: true } } }
                            },
                            education: true,
                            experience: true,
                            certifications: true,
                            portfolios: true,
                        }
                    },
                    professionalReviews: true,
                }
            });
            break;

        case UserRole.DELIVERY:
            userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    ...baseInclude,
                    rider: true,
                    profile: {
                        include: {
                            professional: {
                                include: { profession: { include: { sector: true } } }
                            }
                        }
                    },
                    professionalReviews: true,
                }
            });
            break;

        default:
            userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    ...baseInclude,
                    profile: {
                        include: { cooperation: { include: { director: true } } }
                    },
                    professionalReviews: true,
                }
            });
            break;
    }

    if (userData) {
        userData.password = null;
        if (userData.wallet) {
            userData.wallet.isActive = userData.wallet.pin !== null;
            userData.wallet.pin = null;
        }
    }

    return userData;
};
