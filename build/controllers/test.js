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
exports.testGetProfessional = exports.testRedis = exports.testNotification = exports.sendEmailTest = exports.sendSMSTest = void 0;
exports.findPersonsNearby = findPersonsNearby;
const notification_1 = require("../services/notification");
// sendPushNotification is still exported for direct push testing
const sms_1 = require("../services/sms");
const modules_1 = require("../utils/modules");
const messages_1 = require("../utils/messages");
const gmail_1 = require("../services/gmail");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
const sendSMSTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    const status = yield (0, sms_1.sendSMS)(phone, '123456');
    return (0, modules_1.successResponse)(res, 'OTP sent successfully', { smsSendStatus: status });
});
exports.sendSMSTest = sendSMSTest;
const sendEmailTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const verifyEmailMsg = (0, messages_1.sendOTPEmail)('123456');
    const messageId = yield (0, gmail_1.sendEmail)(email, verifyEmailMsg.title, verifyEmailMsg.body, 'User');
    let emailSendStatus = Boolean(messageId);
    return (0, modules_1.successResponse)(res, 'OTP sent successfully', { emailSendStatus, messsageId: messageId });
});
exports.sendEmailTest = sendEmailTest;
const testNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, title, message, data } = req.body;
        if (!title || !message || !token) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const response = yield (0, notification_1.sendPushNotification)(token, title, message, data);
        return (0, modules_1.successResponse)(res, 'Notification sent successfully', { response });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'Error sending notification', error);
    }
});
exports.testNotification = testNotification;
function findPersonsNearby(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lat, lng, radiusInKm } = req.body;
        const distanceQuery = `
    6371 * acos(
      cos(radians(${lat})) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(latitude))
    )
  `;
        const location = yield prisma_1.default.$queryRawUnsafe(`
        SELECT *, (${distanceQuery}) AS distance
        FROM location
        WHERE (${distanceQuery}) <= ${radiusInKm}
        ORDER BY distance ASC
    `);
        return (0, modules_1.successResponse)(res, 'Persons found nearby', { location });
    });
}
const testRedis = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.default.set("testKey", "Redis is working!");
        const value = yield redis_1.default.get("testKey");
        return (0, modules_1.successResponse)(res, 'success', { status: "ok", message: value });
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.testRedis = testRedis;
const testGetProfessional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { professionalId } = req.params;
        const professional = yield prisma_1.default.professional.findUnique({
            where: { id: Number(professionalId) },
            include: {
                profile: { select: { userId: true } }
            }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, "Professional not found");
        }
        const ratingAgg = yield prisma_1.default.rating.aggregate({
            where: { professionalUserId: (_a = professional.profile) === null || _a === void 0 ? void 0 : _a.userId },
            _avg: { value: true },
            _count: { value: true }
        });
        return (0, modules_1.successResponse)(res, 'success', Object.assign(Object.assign({}, professional), { avgRating: (_b = ratingAgg._avg.value) !== null && _b !== void 0 ? _b : 0, numRating: (_c = ratingAgg._count.value) !== null && _c !== void 0 ? _c : 0 }));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.testGetProfessional = testGetProfessional;
