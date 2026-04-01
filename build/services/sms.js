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
exports.sendWhatsApp = exports.sendSMS = void 0;
const configSetup_1 = __importDefault(require("../config/configSetup"));
const twilio_1 = __importDefault(require("twilio"));
// Check if Twilio credentials are configured
const isTwilioConfigured = configSetup_1.default.TWILIO_ACCOUNT_SID && configSetup_1.default.TWILIO_AUTH_TOKEN && configSetup_1.default.TWILIO_PHONE_NUMBER;
const client = isTwilioConfigured ? (0, twilio_1.default)(configSetup_1.default.TWILIO_ACCOUNT_SID, configSetup_1.default.TWILIO_AUTH_TOKEN) : null;
const sendSMS = (phone, code) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('📱 SMS Service - Attempting to send SMS:', { phone, hasCredentials: isTwilioConfigured });
    if (!isTwilioConfigured) {
        console.error('📱 SMS Service - Twilio credentials not configured in .env file');
        return {
            status: false,
            message: 'Twilio service not configured. Missing credentials in environment.',
        };
    }
    try {
        console.log('📱 SMS Service - Using Twilio phone:', configSetup_1.default.TWILIO_PHONE_NUMBER);
        const message = yield client.messages.create({
            body: `${code} is your Acepick access code. Do not share this with anyone.`,
            from: configSetup_1.default.TWILIO_PHONE_NUMBER,
            to: phone,
        });
        console.log('📱 SMS Service - Message sent successfully:', message.sid);
        return {
            status: true,
            message: message.sid,
        };
    }
    catch (error) {
        console.error('📱 SMS send error:', error.message);
        console.error('📱 SMS error details:', {
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo,
        });
        return {
            status: false,
            message: error.message,
        };
    }
});
exports.sendSMS = sendSMS;
const sendWhatsApp = (phone, code) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield client.messages.create({
            body: `${code} is your Acepick access code. Do not share this with anyone.`,
            from: `whatsapp:${configSetup_1.default.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phone}`,
        });
        return {
            status: true,
            message: message.sid,
        };
    }
    catch (error) {
        console.error('WhatsApp send error:', error.message);
        return {
            status: false,
            message: error.message,
        };
    }
});
exports.sendWhatsApp = sendWhatsApp;
