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
exports.login = exports.authorize = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const configSetup_1 = __importDefault(require("../../config/configSetup"));
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const modules_1 = require("../../utils/modules");
const helpers_1 = require("./helpers");
const authorize = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { token } = req.body;
    if (!token)
        return (0, modules_1.handleResponse)(res, 401, false, `Access Denied / Unauthorized request`);
    if (token.includes('Bearer'))
        token = token.split(' ')[1];
    if (token === 'null' || !token)
        return (0, modules_1.handleResponse)(res, 401, false, `Unauthorized request`);
    let verified = (0, jsonwebtoken_1.verify)(token, configSetup_1.default.TOKEN_SECRET);
    if (!verified)
        return (0, modules_1.handleResponse)(res, 401, false, `Unauthorized request`);
    return (0, modules_1.handleResponse)(res, 200, true, `Authorized`, verified);
});
exports.authorize = authorize;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { email, password, fcmToken } = req.body;
    try {
        const user = yield prisma_1.default.user.findFirst({ where: { email } });
        if (!user)
            return (0, modules_1.handleResponse)(res, 404, false, "User does not exist");
        const match = yield (0, bcryptjs_1.compare)(password, user.password || '');
        if (!match)
            return (0, modules_1.handleResponse)(res, 404, false, "Invalid Credentials");
        const token = (0, helpers_1.generateToken)(user);
        const profile = yield prisma_1.default.profile.findFirst({ where: { userId: user.id } });
        // Save fcmToken to both User (for push notifications) and Profile
        if (fcmToken) {
            yield prisma_1.default.user.update({ where: { id: user.id }, data: { fcmToken } });
        }
        if (profile && fcmToken) {
            yield prisma_1.default.profile.update({ where: { id: profile.id }, data: { fcmToken } });
        }
        const userData = yield (0, helpers_1.getUserDataByRole)(user.id, user.role);
        return (0, modules_1.successResponse)(res, "Successful", { status: true, user: userData, token });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.login = login;
