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
exports.getAdmins = exports.removeAdmin = exports.upgradeUserToAdmin = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const enum_1 = require("../../utils/enum");
const upgradeUserToAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return (0, modules_1.handleResponse)(res, 404, false, "User not found");
        if (user.role === enum_1.UserRole.ADMIN)
            return (0, modules_1.handleResponse)(res, 400, false, "User is already an admin");
        yield prisma_1.default.user.update({ where: { id: userId }, data: { role: enum_1.UserRole.ADMIN } });
        return (0, modules_1.successResponse)(res, 'success', 'User upgraded to admin');
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error upgrading user to admin');
    }
});
exports.upgradeUserToAdmin = upgradeUserToAdmin;
const removeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return (0, modules_1.handleResponse)(res, 404, false, "User not found");
        if (user.role !== enum_1.UserRole.ADMIN)
            return (0, modules_1.handleResponse)(res, 400, false, "User is not an admin");
        yield prisma_1.default.user.update({ where: { id: userId }, data: { role: enum_1.UserRole.CLIENT } });
        return (0, modules_1.successResponse)(res, 'success', 'User removed from admin status');
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error removing admin status');
    }
});
exports.removeAdmin = removeAdmin;
const getAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield prisma_1.default.user.findMany({
            where: { role: enum_1.UserRole.ADMIN },
            include: { profile: true }
        });
        return (0, modules_1.successResponse)(res, 'success', admins);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error getting admins');
    }
});
exports.getAdmins = getAdmins;
