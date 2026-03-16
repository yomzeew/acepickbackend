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
exports.sendEmail = sendEmail;
const nodemailer = require('nodemailer');
const configSetup_1 = __importDefault(require("../config/configSetup"));
const template_1 = require("../config/template");
const transporter = nodemailer.createTransport({
    host: configSetup_1.default.EMAIL_HOST,
    port: configSetup_1.default.EMAIL_PORT,
    secure: false,
    // requireTLS: false,
    auth: {
        user: configSetup_1.default.EMAIL_USER,
        pass: configSetup_1.default.EMAIL_PASS
    },
    // tls: {
    //     rejectUnauthorized: false
    // }
});
function sendEmail(to, subject, text, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: configSetup_1.default.EMAIL_FROM,
            to: to,
            subject: subject,
            text: '',
            html: (0, template_1.templateData)(text, username)
        };
        try {
            const info = yield transporter.sendMail(mailOptions);
            return {
                success: true,
                message: 'Email sent successfully',
                messageId: info.messageId,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to send email',
                error: error
            };
        }
    });
}
module.exports = {
    sendEmail
};
