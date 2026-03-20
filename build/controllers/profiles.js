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
exports.getUsers = exports.updateProfile = exports.UserAccountInfo = exports.MyAccountInfo = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const body_1 = require("../validation/body");
const query_1 = require("../validation/query");
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
const MyAccountInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.user;
    try {
        const profile = yield prisma_1.default.profile.findFirst({
            where: { userId: id },
            include: fullProfileInclude,
        });
        if (!profile)
            return (0, modules_1.errorResponse)(res, "Failed", { status: false, message: "Profile Does'nt exist" });
        const walletPin = (_b = (_a = profile.user) === null || _a === void 0 ? void 0 : _a.wallet) === null || _b === void 0 ? void 0 : _b.pin;
        const result = Object.assign(Object.assign({}, profile), { user: Object.assign(Object.assign({}, profile.user), { wallet: ((_c = profile.user) === null || _c === void 0 ? void 0 : _c.wallet) ? Object.assign(Object.assign({}, profile.user.wallet), { pin: undefined, isActive: walletPin !== null }) : null }) });
        return (0, modules_1.successResponse)(res, "Successful", result);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "Failed", { error: error === null || error === void 0 ? void 0 : error.message });
    }
});
exports.MyAccountInfo = MyAccountInfo;
const UserAccountInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { userId } = req.params;
    try {
        const profile = yield prisma_1.default.profile.findFirst({
            where: { userId: userId },
            include: fullProfileInclude,
        });
        if (!profile)
            return (0, modules_1.errorResponse)(res, "Failed", { status: false, message: "Profile Does'nt exist" });
        const walletPin = (_b = (_a = profile.user) === null || _a === void 0 ? void 0 : _a.wallet) === null || _b === void 0 ? void 0 : _b.pin;
        const result = Object.assign(Object.assign({}, profile), { user: Object.assign(Object.assign({}, profile.user), { wallet: ((_c = profile.user) === null || _c === void 0 ? void 0 : _c.wallet) ? Object.assign(Object.assign({}, profile.user.wallet), { pin: undefined, isActive: walletPin !== null }) : null }) });
        return (0, modules_1.successResponse)(res, "Successful", result);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "Failed", { error: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error" });
    }
});
exports.UserAccountInfo = UserAccountInfo;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id, role } = req.user;
    const result = body_1.updateUserProfileSchema.safeParse(req.body);
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
            yield prisma_1.default.profile.updateMany({
                where: { userId: id },
                data: bio
            });
        }
        if (contact) {
            yield prisma_1.default.user.update({
                where: { id },
                data: contact
            });
        }
        if (location) {
            const existingLocation = yield prisma_1.default.location.findFirst({ where: { userId: id } });
            if (existingLocation) {
                yield prisma_1.default.location.update({
                    where: { id: existingLocation.id },
                    data: location
                });
            }
            else {
                yield prisma_1.default.location.create({
                    data: Object.assign(Object.assign({}, location), { userId: id })
                });
            }
        }
        return (0, modules_1.successResponse)(res, "success", "Profile updated successfully");
    }
    catch (error) {
        console.error("Profile update error:", (error === null || error === void 0 ? void 0 : error.message) || error);
        return (0, modules_1.errorResponse)(res, "Failed", (error === null || error === void 0 ? void 0 : error.message) || error);
    }
});
exports.updateProfile = updateProfile;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = query_1.getUsersQuerySchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    console.log(result.data);
    const { search, professionId, page, limit, role } = result.data;
    try {
        const contacts = yield prisma_1.default.user.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (role && { role: role })), { id: { not: id }, profile: search
                    ? {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : undefined }), (professionId && {
                profile: Object.assign(Object.assign({}, (search ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                    ],
                } : {})), { professional: {
                        professionId: Number(professionId),
                    } }),
            })),
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
        return (0, modules_1.successResponse)(res, 'success', contacts);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, "Failed", error);
    }
});
exports.getUsers = getUsers;
