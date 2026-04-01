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
exports.verifyOtp = exports.sendOtp = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const configSetup_1 = __importDefault(require("../../config/configSetup"));
const enum_1 = require("../../utils/enum");
const modules_1 = require("../../utils/modules");
const body_1 = require("../../validation/body");
const sms_1 = require("../../services/sms");
const gmail_1 = require("../../services/gmail");
const messages_1 = require("../../utils/messages");
const sendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = body_1.otpRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: parsed.error.format(),
        });
    }
    const { email, phone, type, reason } = parsed.data;
    const codeEmail = String(Math.floor(1000 + Math.random() * 9000));
    const codeSms = String(Math.floor(1000 + Math.random() * 9000));
    let emailSendStatus;
    let smsSendStatus;
    try {
        if (type === enum_1.VerificationType.EMAIL || type === enum_1.VerificationType.BOTH) {
            yield prisma_1.default.verify.create({
                data: { contact: email, code: codeEmail, type: enum_1.VerificationType.EMAIL }
            });
            let emailResult;
            if (reason === enum_1.OTPReason.VERIFICATION) {
                const verifyEmailMsg = (0, messages_1.sendOTPEmail)(codeEmail);
                emailResult = yield (0, gmail_1.sendEmail)(email, verifyEmailMsg.title, verifyEmailMsg.body, 'User');
            }
            else if (reason === enum_1.OTPReason.FORGOT_PASSWORD) {
                const msg = (0, messages_1.forgotPasswordEmail)(codeEmail);
                emailResult = yield (0, gmail_1.sendEmail)(email, msg.title, msg.body, 'User');
            }
            emailSendStatus = (emailResult === null || emailResult === void 0 ? void 0 : emailResult.success) === true;
            if (!emailSendStatus) {
                console.error('[OTP] Email send failed:', (emailResult === null || emailResult === void 0 ? void 0 : emailResult.message) || 'Unknown error');
            }
        }
        if (type === enum_1.VerificationType.SMS || type === enum_1.VerificationType.BOTH) {
            yield prisma_1.default.verify.create({
                data: { contact: phone, code: codeSms, type: enum_1.VerificationType.SMS }
            });
            const smsResult = yield (0, sms_1.sendSMS)(phone, codeSms.toString());
            smsSendStatus = smsResult.status;
        }
        return (0, modules_1.successResponse)(res, 'OTP sent successfully', { emailSendStatus, smsSendStatus });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, error.message, error);
    }
});
exports.sendOtp = sendOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = body_1.verifyOTPSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "Invalid input",
            issues: result.error.format()
        });
    }
    const { smsCode, emailCode } = result.data;
    let emailVerified = false;
    let smsVerified = false;
    let emailError = null;
    let smsError = null;
    try {
        // Verify email OTP independently
        if (emailCode) {
            const verifyEmail = yield prisma_1.default.verify.findFirst({
                where: { code: emailCode.code, contact: emailCode.email }
            });
            if (!verifyEmail) {
                emailError = 'Invalid Email Code';
            }
            else if (verifyEmail.verified) {
                emailError = 'Email Code already verified';
            }
            else if (verifyEmail.createdAt < new Date(Date.now() - configSetup_1.default.OTP_EXPIRY_TIME * 60 * 1000)) {
                emailError = 'Email Code expired';
            }
            else {
                yield prisma_1.default.verify.update({ where: { id: verifyEmail.id }, data: { verified: true } });
                emailVerified = true;
            }
        }
        // Verify SMS OTP independently
        if (smsCode) {
            const verifySms = yield prisma_1.default.verify.findFirst({
                where: { code: smsCode.code, contact: smsCode.phone }
            });
            if (!verifySms) {
                smsError = 'Invalid SMS Code';
            }
            else if (verifySms.verified) {
                smsError = 'SMS Code already verified';
            }
            else if (verifySms.createdAt < new Date(Date.now() - configSetup_1.default.OTP_EXPIRY_TIME * 60 * 1000)) {
                smsError = 'SMS Code expired';
            }
            else {
                yield prisma_1.default.verify.update({ where: { id: verifySms.id }, data: { verified: true } });
                smsVerified = true;
            }
        }
        // Succeed if at least one verification passed
        if (emailVerified || smsVerified) {
            return (0, modules_1.successResponse)(res, 'OTP verified successfully', {
                emailVerified,
                smsVerified,
                emailError,
                smsError,
            });
        }
        // Both failed or none provided valid codes
        const errors = [emailError, smsError].filter(Boolean).join('; ');
        return (0, modules_1.errorResponse)(res, errors || 'No valid OTP code provided', null);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.verifyOtp = verifyOtp;
