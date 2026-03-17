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
exports.getUserDataByRole = exports.sanitizeUserData = exports.logActivity = exports.createWallet = exports.checkVerification = exports.checkExistingUser = exports.generateToken = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const configSetup_1 = __importDefault(require("../../config/configSetup"));
const enum_1 = require("../../utils/enum");
const jsonwebtoken_1 = require("jsonwebtoken");
const generateToken = (user) => {
    return (0, jsonwebtoken_1.sign)({ id: user.id, email: user.email, role: user.role }, configSetup_1.default.TOKEN_SECRET);
};
exports.generateToken = generateToken;
const checkExistingUser = (email, phone) => __awaiter(void 0, void 0, void 0, function* () {
    const existingEmail = yield prisma_1.default.user.findFirst({ where: { email } });
    if (existingEmail)
        return "Email already exist";
    const existingPhone = yield prisma_1.default.user.findFirst({ where: { phone } });
    if (existingPhone)
        return "Phone already exist";
    return null;
});
exports.checkExistingUser = checkExistingUser;
const checkVerification = (email, phone) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedEmail = yield prisma_1.default.verify.findFirst({ where: { contact: email, verified: true } });
    const verifiedPhone = yield prisma_1.default.verify.findFirst({ where: { contact: phone, verified: true } });
    if (!verifiedEmail && !verifiedPhone)
        return "Email or Phone must be verified";
    return null;
});
exports.checkVerification = checkVerification;
const createWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.wallet.create({
        data: { userId, previousBalance: 0, currentBalance: 0 }
    });
});
exports.createWallet = createWallet;
const logActivity = (userId_1, action_1, type_1, ...args_1) => __awaiter(void 0, [userId_1, action_1, type_1, ...args_1], void 0, function* (userId, action, type, status = 'success') {
    // Map string status to enum value
    const statusMap = {
        'success': 'act_success',
        'failed': 'act_failed',
        'pending': 'act_pending'
    };
    return prisma_1.default.activity.create({
        data: { userId, action, type, status: statusMap[status] || 'act_success' }
    });
});
exports.logActivity = logActivity;
const sanitizeUserData = (user, profile, wallet, extras) => {
    return Object.assign(Object.assign(Object.assign({}, user), { password: null, profile, wallet: wallet ? Object.assign(Object.assign({}, wallet), { pin: null }) : null }), extras);
};
exports.sanitizeUserData = sanitizeUserData;
const getUserDataByRole = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const baseInclude = { wallet: true, location: true };
    let userData;
    switch (role) {
        case enum_1.UserRole.CLIENT:
            userData = yield prisma_1.default.user.findUnique({
                where: { id: userId },
                include: Object.assign(Object.assign({}, baseInclude), { profile: true })
            });
            break;
        case enum_1.UserRole.PROFESSIONAL:
            userData = yield prisma_1.default.user.findUnique({
                where: { id: userId },
                include: Object.assign(Object.assign({}, baseInclude), { profile: {
                        include: {
                            professional: {
                                include: { profession: { include: { sector: true } } }
                            },
                            education: true,
                            experience: true,
                            certifications: true,
                            portfolios: true,
                        }
                    }, professionalReviews: true })
            });
            break;
        case enum_1.UserRole.DELIVERY:
            userData = yield prisma_1.default.user.findUnique({
                where: { id: userId },
                include: Object.assign(Object.assign({}, baseInclude), { rider: true, profile: {
                        include: {
                            professional: {
                                include: { profession: { include: { sector: true } } }
                            }
                        }
                    }, professionalReviews: true })
            });
            break;
        default:
            userData = yield prisma_1.default.user.findUnique({
                where: { id: userId },
                include: Object.assign(Object.assign({}, baseInclude), { profile: {
                        include: { cooperation: { include: { director: true } } }
                    }, professionalReviews: true })
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
});
exports.getUserDataByRole = getUserDataByRole;
