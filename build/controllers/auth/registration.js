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
exports.corperateReg = exports.registerRider = exports.registerCorperate = exports.registerProfessional = exports.register = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const enum_1 = require("../../utils/enum");
const modules_1 = require("../../utils/modules");
const body_1 = require("../../validation/body");
const messages_1 = require("../../utils/messages");
const gmail_1 = require("../../services/gmail");
const helpers_1 = require("./helpers");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = body_1.registrationSchema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    const { email, phone, password, agreed, firstName, lastName, lga, state, address, avatar } = result.data;
    try {
        if (!(0, modules_1.validateEmail)(email))
            return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid email");
        if (!(0, modules_1.validatePhone)(phone))
            return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid phone number");
        const existingError = yield (0, helpers_1.checkExistingUser)(email, phone);
        if (existingError)
            return (0, modules_1.handleResponse)(res, 400, false, existingError);
        const verificationError = yield (0, helpers_1.checkVerification)(email, phone);
        if (verificationError)
            return (0, modules_1.handleResponse)(res, 404, false, verificationError);
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: { email, phone, password: hashedPassword, role: enum_1.UserRole.CLIENT, agreed }
        });
        const profile = yield prisma_1.default.profile.create({
            data: { userId: user.id, firstName, lastName, avatar }
        });
        yield prisma_1.default.location.create({
            data: { userId: user.id, lga, state, address }
        });
        const wallet = yield (0, helpers_1.createWallet)(user.id);
        const token = (0, helpers_1.generateToken)(user);
        const userData = (0, helpers_1.sanitizeUserData)(user, profile, wallet);
        const regEmail = (0, messages_1.registerEmail)(userData);
        const { success } = yield (0, gmail_1.sendEmail)(email, regEmail.title, regEmail.body, profile.firstName || 'User');
        yield (0, helpers_1.logActivity)(user.id, `${profile.firstName} ${profile.lastName} registered as a client`, 'New User');
        return (0, modules_1.successResponse)(res, "success", { user: userData, token, emailSendStatus: success });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', { message: error.message, error });
    }
});
exports.register = register;
const registerProfessional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = body_1.registrationProfSchema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    const { email, phone, password, agreed, firstName, lastName, lga, state, address, avatar, professionId } = result.data;
    try {
        if (!(0, modules_1.validateEmail)(email))
            return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid email");
        if (!(0, modules_1.validatePhone)(phone))
            return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid phone number");
        const verificationError = yield (0, helpers_1.checkVerification)(email, phone);
        if (verificationError)
            return (0, modules_1.handleResponse)(res, 404, false, verificationError);
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: { email, phone, password: hashedPassword, role: enum_1.UserRole.PROFESSIONAL, agreed }
        });
        const profile = yield prisma_1.default.profile.create({
            data: { userId: user.id, firstName, lastName, avatar }
        });
        yield prisma_1.default.location.create({
            data: { userId: user.id, lga, state, address }
        });
        const professional = yield prisma_1.default.professional.create({
            data: { profileId: profile.id, professionId: professionId }
        });
        const wallet = yield (0, helpers_1.createWallet)(user.id);
        const token = (0, helpers_1.generateToken)(user);
        const userData = (0, helpers_1.sanitizeUserData)(user, profile, wallet, { professional });
        const regEmail = (0, messages_1.registerEmail)(userData);
        const { success } = yield (0, gmail_1.sendEmail)(email, regEmail.title, regEmail.body, profile.firstName || 'User');
        yield (0, helpers_1.logActivity)(user.id, `${profile.firstName} ${profile.lastName} registered as a professional`, 'New User');
        return (0, modules_1.successResponse)(res, "success", { user: userData, token, emailSendStatus: success });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', { message: error.message, error });
    }
});
exports.registerProfessional = registerProfessional;
const registerCorperate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = body_1.registerCoporateSchema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    const { email, phone, password, confirmPassword, position, agreed, firstName, lastName, cooperation } = result.data;
    if (!(0, modules_1.validateEmail)(email))
        return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid email");
    if (!(0, modules_1.validatePhone)(phone))
        return (0, modules_1.handleResponse)(res, 404, false, "Enter a valid phone number");
    try {
        const verificationError = yield (0, helpers_1.checkVerification)(email, phone);
        if (verificationError)
            return (0, modules_1.handleResponse)(res, 404, false, verificationError);
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: { email, phone, password: hashedPassword, role: enum_1.UserRole.CORPERATE, agreed }
        });
        yield prisma_1.default.location.create({
            data: { userId: user.id, lga: cooperation.lga, state: cooperation.state, address: cooperation.address }
        });
        const profile = yield prisma_1.default.profile.create({
            data: { avatar: cooperation.avatar, userId: user.id, firstName, lastName, position }
        });
        const newCooperation = yield prisma_1.default.cooperation.create({
            data: {
                nameOfOrg: cooperation.nameOfOrg,
                phone: cooperation.phone,
                regNum: cooperation.regNum,
                noOfEmployees: String(cooperation.noOfEmployees),
                professionId: cooperation.professionId,
                profileId: profile.id
            }
        });
        yield prisma_1.default.director.create({
            data: {
                firstName: cooperation.director.firstName,
                lastName: cooperation.director.lastName,
                email: cooperation.director.email,
                phone: cooperation.director.phone,
                address: cooperation.director.address,
                state: cooperation.director.state,
                lga: cooperation.director.lga,
                cooperateId: newCooperation.id
            }
        });
        const wallet = yield (0, helpers_1.createWallet)(user.id);
        const token = (0, helpers_1.generateToken)(user);
        const userData = (0, helpers_1.sanitizeUserData)(user, profile, wallet);
        const regEmail = (0, messages_1.registerEmail)(userData);
        const { success } = yield (0, gmail_1.sendEmail)(email, regEmail.title, regEmail.body, (profile === null || profile === void 0 ? void 0 : profile.firstName) || 'User');
        yield (0, helpers_1.logActivity)(user.id, `${newCooperation.nameOfOrg} registered as a corperate`, 'New User');
        return (0, modules_1.successResponse)(res, "success", { user: userData, token, emailSendStatus: success });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.registerCorperate = registerCorperate;
const registerRider = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = body_1.registerRiderSchema.safeParse(req.body);
        if (!result.success)
            return res.status(400).json({
                error: "Invalid input",
                issues: result.error.format()
            });
        const { email, phone, password, confirmPassword, agreed, avatar, firstName, lastName, address, state, lga, rider } = result.data;
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: { email, phone, password: hashedPassword, role: enum_1.UserRole.DELIVERY }
        });
        yield prisma_1.default.location.create({
            data: { userId: user.id, lga, state, address }
        });
        const profile = yield prisma_1.default.profile.create({
            data: { avatar, userId: user.id, firstName, lastName }
        });
        yield prisma_1.default.rider.create({
            data: {
                userId: user.id,
                vehicleType: rider.vehicleType,
                licenseNumber: rider.licenseNumber,
                status: enum_1.RiderStatus.AVAILABLE
            }
        });
        const wallet = yield (0, helpers_1.createWallet)(user.id);
        const token = (0, helpers_1.generateToken)(user);
        const userData = (0, helpers_1.sanitizeUserData)(user, profile, wallet);
        const regEmail = (0, messages_1.registerEmail)(userData);
        const { success } = yield (0, gmail_1.sendEmail)(email, regEmail.title, regEmail.body, (profile === null || profile === void 0 ? void 0 : profile.firstName) || 'User');
        yield (0, helpers_1.logActivity)(user.id, `${profile.firstName} ${profile.lastName} registered as a rider`, 'New User');
        return (0, modules_1.successResponse)(res, "success", { user: userData, token, emailSendStatus: success });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, "error", 'Error registering rider');
    }
});
exports.registerRider = registerRider;
const corperateReg = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { nameOfOrg, phone, address, state, lga, postalCode, regNum, noOfEmployees } = req.body;
    let { id } = req.user;
    const user = yield prisma_1.default.user.findUnique({ where: { id } });
    const corperate = yield prisma_1.default.cooperation.findFirst({ where: { profileId: (_a = (yield prisma_1.default.profile.findFirst({ where: { userId: id } }))) === null || _a === void 0 ? void 0 : _a.id } });
    if (corperate)
        return (0, modules_1.errorResponse)(res, "Failed", { status: false, message: "Coorperate Account Already Exist" });
    const profile = yield prisma_1.default.profile.findFirst({ where: { userId: id } });
    const coorperateCreate = yield prisma_1.default.cooperation.create({
        data: { nameOfOrg, phone, regNum, noOfEmployees: String(noOfEmployees), profileId: profile === null || profile === void 0 ? void 0 : profile.id }
    });
});
exports.corperateReg = corperateReg;
