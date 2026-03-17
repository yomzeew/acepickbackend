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
exports.deleteUsers = exports.postlocationData = exports.updateRider = exports.updatePushToken = exports.updateProfile = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const body_1 = require("../../validation/body");
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { postalCode, lga, state, address, avatar } = req.body;
    let { id } = req.user;
    const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
    if (!(profile === null || profile === void 0 ? void 0 : profile.verified))
        return (0, modules_1.errorResponse)(res, "Verify your bvn");
    const updated = yield prisma_1.default.profile.update({
        where: { id: profile.id },
        data: { avatar: avatar !== null && avatar !== void 0 ? avatar : profile.avatar }
    });
    return (0, modules_1.successResponse)(res, "Updated Successfully", updated);
});
exports.updateProfile = updateProfile;
const updatePushToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token)
            return (0, modules_1.errorResponse)(res, "Token is required", { status: false });
        const { id } = req.user;
        const user = yield prisma_1.default.user.findUnique({ where: { id } });
        if (!user)
            return (0, modules_1.errorResponse)(res, "User not found", { status: false });
        yield prisma_1.default.user.update({ where: { id }, data: { fcmToken: token } });
        return (0, modules_1.successResponse)(res, "Successful", { status: true, user });
    }
    catch (error) {
    }
    return (0, modules_1.errorResponse)(res, "error", 'Error updating push token');
});
exports.updatePushToken = updatePushToken;
const updateRider = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.updateRiderSchema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    try {
        const existing = yield prisma_1.default.rider.findFirst({ where: { userId: id } });
        if (!existing)
            return (0, modules_1.errorResponse)(res, "Rider not found");
        const rider = yield prisma_1.default.rider.update({
            where: { id: existing.id },
            data: result.data
        });
        return (0, modules_1.successResponse)(res, "Rider updated successfully", rider);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "Error updating rider", error);
    }
});
exports.updateRider = updateRider;
const postlocationData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lan, log, address } = req.body;
    const { id } = req.user;
    try {
        const getlocation = yield prisma_1.default.location.findFirst({ where: { userId: id } });
        if (getlocation) {
            const location = yield prisma_1.default.location.update({
                where: { id: getlocation.id },
                data: {
                    latitude: lan !== null && lan !== void 0 ? lan : getlocation.latitude,
                    longitude: log !== null && log !== void 0 ? log : getlocation.longitude,
                    address: address !== null && address !== void 0 ? address : getlocation.address,
                }
            });
            if (location)
                return (0, modules_1.successResponse)(res, "Updated Successfully", location);
            return (0, modules_1.errorResponse)(res, "Failed updating Location");
        }
        else {
            const location = yield prisma_1.default.location.create({
                data: { latitude: lan, longitude: log, userId: id, address }
            });
            if (location)
                return (0, modules_1.successResponse)(res, "Created Successfully", location);
            return (0, modules_1.errorResponse)(res, "Failed Creating Location");
        }
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, `An error occurred - ${error}`);
    }
});
exports.postlocationData = postlocationData;
const deleteUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.user.deleteMany({});
    return (0, modules_1.successResponse)(res, "Successful");
});
exports.deleteUsers = deleteUsers;
