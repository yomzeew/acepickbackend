"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchRole = exports.getAvailableRoles = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
const helpers_1 = require("./auth/helpers");
const modules_1 = require("../utils/modules");
/**
 * Derive which roles the authenticated user is eligible to switch to,
 * based on existing records (Professional, Rider, Cooperation).
 * Every user can always switch back to CLIENT.
 */
const getAvailableRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const user = yield prisma_1.default.user.findUnique({
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
        const roles = [
            {
                role: enum_1.UserRole.CLIENT,
                label: 'Client',
                available: true, // always available
            },
            {
                role: enum_1.UserRole.PROFESSIONAL,
                label: 'Professional / Artisan',
                available: !!((_a = user.profile) === null || _a === void 0 ? void 0 : _a.professional),
            },
            {
                role: enum_1.UserRole.DELIVERY,
                label: 'Delivery Partner',
                available: !!user.rider,
            },
            {
                role: enum_1.UserRole.CORPERATE,
                label: 'Corporate',
                available: !!((_b = user.profile) === null || _b === void 0 ? void 0 : _b.cooperation),
            },
        ];
        (0, modules_1.successResponse)(res, 'Available roles', {
            currentRole: user.role,
            roles,
        });
    }
    catch (error) {
        console.error('getAvailableRoles error:', error);
        (0, modules_1.errorResponse)(res, 'error', { message: error.message });
    }
});
exports.getAvailableRoles = getAvailableRoles;
/**
 * Switch the authenticated user's active role.
 * Body: { role: string }
 * - Validates the target role is one the user is eligible for.
 * - Updates user.role in DB.
 * - Returns a fresh JWT token + user data for the new role.
 */
const switchRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const { role: targetRole } = req.body;
        if (!targetRole) {
            res.status(400).json({ success: false, message: 'Target role is required' });
            return;
        }
        // Validate targetRole is a known role
        const allowedTargets = [enum_1.UserRole.CLIENT, enum_1.UserRole.PROFESSIONAL, enum_1.UserRole.DELIVERY, enum_1.UserRole.CORPERATE];
        if (!allowedTargets.includes(targetRole)) {
            res.status(400).json({ success: false, message: `Invalid role: ${targetRole}` });
            return;
        }
        const user = yield prisma_1.default.user.findUnique({
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
            case enum_1.UserRole.CLIENT:
                // Always allowed
                break;
            case enum_1.UserRole.PROFESSIONAL:
                if (!((_a = user.profile) === null || _a === void 0 ? void 0 : _a.professional)) {
                    res.status(403).json({
                        success: false,
                        message: 'You need to complete professional registration first',
                        action: 'register_professional',
                    });
                    return;
                }
                break;
            case enum_1.UserRole.DELIVERY:
                if (!user.rider) {
                    res.status(403).json({
                        success: false,
                        message: 'You need to complete delivery partner registration first',
                        action: 'register_delivery',
                    });
                    return;
                }
                break;
            case enum_1.UserRole.CORPERATE:
                if (!((_b = user.profile) === null || _b === void 0 ? void 0 : _b.cooperation)) {
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
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: { role: targetRole },
        });
        // Generate new token with updated role
        const token = (0, helpers_1.generateToken)(updatedUser);
        // Get full user data for the new role
        const userData = yield (0, helpers_1.getUserDataByRole)(userId, targetRole);
        (0, modules_1.successResponse)(res, 'Role switched successfully', {
            user: userData,
            token,
        });
    }
    catch (error) {
        console.error('switchRole error:', error);
        (0, modules_1.errorResponse)(res, 'error', { message: error.message });
    }
});
exports.switchRole = switchRole;
