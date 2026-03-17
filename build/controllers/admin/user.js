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
exports.emailUser = exports.toggleSuspension = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const enum_1 = require("../../utils/enum");
const modules_1 = require("../../utils/modules");
const messages_1 = require("../../utils/messages");
const gmail_1 = require("../../services/gmail");
const zod_1 = require("zod");
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { role } = req.params;
    const result = zod_1.z.object({
        role: zod_1.z.nativeEnum(enum_1.UserRole),
    }).safeParse(req.params);
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid role",
            details: result.error.flatten().fieldErrors,
        });
    }
    try {
        const clients = yield prisma_1.default.user.findMany({
            where: { role: role },
            include: { profile: true },
            orderBy: { createdAt: 'desc' }
        });
        // Exclude password from results
        const sanitized = clients.map((u) => { u.password = null; return u; });
        return (0, modules_1.successResponse)(res, 'success', sanitized);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.getAllUsers = getAllUsers;
const toggleSuspension = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.user;
    const { userId } = req.params;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId }, include: { profile: true } });
        if (!user) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
        }
        if (user.status === enum_1.UserStatus.ACTIVE) {
            yield prisma_1.default.user.update({ where: { id: userId }, data: { status: enum_1.UserStatus.SUSPENDED } });
            const email = (0, messages_1.suspendUserEmail)(user);
            yield (0, gmail_1.sendEmail)(user.email, email.title, email.body, ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || 'User');
            return (0, modules_1.successResponse)(res, 'success', 'User suspended successfully');
        }
        else {
            yield prisma_1.default.user.update({ where: { id: userId }, data: { status: enum_1.UserStatus.ACTIVE } });
            const email = (0, messages_1.reactivateUserEmail)(user);
            yield (0, gmail_1.sendEmail)(user.email, email.title, email.body, ((_b = user.profile) === null || _b === void 0 ? void 0 : _b.firstName) || 'User');
            return (0, modules_1.successResponse)(res, 'success', 'User reactivated successfully');
        }
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.toggleSuspension = toggleSuspension;
const emailUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId, title, body } = req.body;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId }, include: { profile: true } });
        if (!user) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
        }
        const { success, error } = yield (0, gmail_1.sendEmail)(user.email, title, body, ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || 'User');
        if (success) {
            return (0, modules_1.handleResponse)(res, 200, true, 'Email sent successfully');
        }
        throw error;
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'An error ocurred');
    }
});
exports.emailUser = emailUser;
