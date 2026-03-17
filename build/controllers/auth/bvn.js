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
exports.verifyBvnHook = exports.verifyBvnMatch = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const axios_1 = __importDefault(require("axios"));
const modules_1 = require("../../utils/modules");
const verifyBvnMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { bvn } = req.body;
    const { id, role } = req.user;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id },
            include: { profile: true }
        });
        if (!user) {
            return (0, modules_1.handleResponse)(res, 404, false, 'User not found');
        }
        if (!user.phone || !((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || !((_b = user.profile) === null || _b === void 0 ? void 0 : _b.lastName)) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Phone or First Name or Last name is missing');
        }
        if (user.profile.bvnVerified) {
            return (0, modules_1.handleResponse)(res, 400, false, "BVN already verified");
        }
        const baseUrl = 'https://api.qoreid.com';
        let response = yield axios_1.default.post(`${baseUrl}/token`, {
            "clientId": "Z2YZZNAWSGPFF63Z2M5H",
            "secret": "f1b57902f30f4a8998228ef36aa0d6b8"
        });
        const token = response.data.accessToken;
        response = yield axios_1.default.post(`${baseUrl}/v1/ng/identities/bvn-match/${bvn}`, {
            firstname: user.profile.firstName,
            lastname: user.profile.lastName,
            phone: user.phone
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        yield prisma_1.default.profile.update({
            where: { id: user.profile.id },
            data: { bvnVerified: response.data.metadata.match }
        });
        const verifyStatus = response.data.bvn_match.fieldMatches;
        return (0, modules_1.successResponse)(res, "BVN verified successfully", verifyStatus);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, "BVN verification failed", error);
    }
});
exports.verifyBvnMatch = verifyBvnMatch;
const verifyBvnHook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    res.status(200).json({ status: "success" });
});
exports.verifyBvnHook = verifyBvnHook;
