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
exports.changePassword = exports.passwordChange = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcryptjs_1 = require("bcryptjs");
const modules_1 = require("../../utils/modules");
const passwordChange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { password, confirmPassword } = req.body;
    const { id } = req.user;
    if (password !== confirmPassword)
        return (0, modules_1.errorResponse)(res, "Password do not match", { status: false, message: "Password do not match" });
    const user = yield prisma_1.default.user.findUnique({ where: { id } });
    if (!user)
        return (0, modules_1.errorResponse)(res, "Failed", { status: false, message: "User does not exist" });
    (0, bcryptjs_1.hash)(password, modules_1.saltRounds, function (err, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.user.update({ where: { id }, data: { password: hashedPassword } });
            return (0, modules_1.successResponse)(res, "Password changed successfully");
        });
    });
});
exports.passwordChange = passwordChange;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        (0, bcryptjs_1.hash)(password, modules_1.saltRounds, function (err, hashedPassword) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield prisma_1.default.user.findFirst({ where: { email } });
                if (user) {
                    yield prisma_1.default.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
                }
                return (0, modules_1.successResponse)(res, "Password Changed Successfully");
            });
        });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "Failed", { status: false, message: "Error changing password" });
    }
});
exports.changePassword = changePassword;
