import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { UserRole } from '../utils/enum';
import { generateToken, getUserDataByRole } from './auth/helpers';
import { successResponse, errorResponse, handleResponse } from '../utils/modules';

/**
 * Derive which roles the authenticated user is eligible to switch to,
 * based on existing records (Professional, Rider, Cooperation).
 * Every user can always switch back to CLIENT.
 */
export const getAvailableRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        professional: true,
                        cooperation: true,
                    },
                },
                rider: true,
            },
        });

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const roles: { role: string; label: string; available: boolean }[] = [
            {
                role: UserRole.CLIENT,
                label: 'Client',
                available: true, // always available
            },
            {
                role: UserRole.PROFESSIONAL,
                label: 'Professional / Artisan',
                available: !!user.profile?.professional,
            },
            {
                role: UserRole.DELIVERY,
                label: 'Delivery Partner',
                available: !!user.rider,
            },
            {
                role: UserRole.CORPERATE,
                label: 'Corporate',
                available: !!user.profile?.cooperation,
            },
        ];

        successResponse(res, 'Available roles', {
            currentRole: user.role,
            roles,
        });
    } catch (error: any) {
        console.error('getAvailableRoles error:', error);
        errorResponse(res, 'error', { message: error.message });
    }
};

/**
 * Switch the authenticated user's active role.
 * Body: { role: string }
 * - Validates the target role is one the user is eligible for.
 * - Updates user.role in DB.
 * - Returns a fresh JWT token + user data for the new role.
 */
export const switchRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { role: targetRole } = req.body;

        if (!targetRole) {
            res.status(400).json({ success: false, message: 'Target role is required' });
            return;
        }

        // Validate targetRole is a known role
        const allowedTargets = [UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.DELIVERY, UserRole.CORPERATE];
        if (!allowedTargets.includes(targetRole as UserRole)) {
            res.status(400).json({ success: false, message: `Invalid role: ${targetRole}` });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        professional: true,
                        cooperation: true,
                    },
                },
                rider: true,
            },
        });

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Already on this role
        if (user.role === targetRole) {
            res.status(400).json({ success: false, message: 'You are already on this role' });
            return;
        }

        // Check eligibility
        switch (targetRole) {
            case UserRole.CLIENT:
                // Always allowed
                break;
            case UserRole.PROFESSIONAL:
                if (!user.profile?.professional) {
                    res.status(403).json({
                        success: false,
                        message: 'You need to complete professional registration first',
                        action: 'register_professional',
                    });
                    return;
                }
                break;
            case UserRole.DELIVERY:
                if (!user.rider) {
                    res.status(403).json({
                        success: false,
                        message: 'You need to complete delivery partner registration first',
                        action: 'register_delivery',
                    });
                    return;
                }
                break;
            case UserRole.CORPERATE:
                if (!user.profile?.cooperation) {
                    res.status(403).json({
                        success: false,
                        message: 'You need to complete corporate registration first',
                        action: 'register_corporate',
                    });
                    return;
                }
                break;
        }

        // Update role in DB
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: targetRole as any },
        });

        // Generate new token with updated role
        const token = generateToken(updatedUser);

        // Get full user data for the new role
        const userData = await getUserDataByRole(userId, targetRole);

        successResponse(res, 'Role switched successfully', {
            user: userData,
            token,
        });
    } catch (error: any) {
        console.error('switchRole error:', error);
        errorResponse(res, 'error', { message: error.message });
    }
};
