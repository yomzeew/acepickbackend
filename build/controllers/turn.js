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
exports.getTurnCredentials = void 0;
const configSetup_1 = __importDefault(require("../config/configSetup"));
const modules_1 = require("../utils/modules");
/**
 * Generate short-lived Cloudflare TURN credentials for WebRTC calls.
 * Returns iceServers array ready to pass to RTCPeerConnection.
 */
const getTurnCredentials = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!configSetup_1.default.CLOUDFLARE_TURN_TOKEN_ID || !configSetup_1.default.CLOUDFLARE_TURN_API_TOKEN) {
            return (0, modules_1.errorResponse)(res, "TURN server not configured");
        }
        const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${configSetup_1.default.CLOUDFLARE_TURN_TOKEN_ID}/credentials/generate-ice-servers`;
        const response = yield fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${configSetup_1.default.CLOUDFLARE_TURN_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ttl: 86400 }),
        });
        if (!response.ok) {
            const text = yield response.text();
            console.error("Cloudflare TURN error:", response.status, text);
            return res.status(502).json({ status: false, message: "Failed to generate TURN credentials", data: text });
        }
        const data = yield response.json();
        return (0, modules_1.successResponse)(res, "TURN credentials generated", data);
    }
    catch (error) {
        console.error("getTurnCredentials error:", error);
        return (0, modules_1.errorResponse)(res, "Failed to generate TURN credentials", error);
    }
});
exports.getTurnCredentials = getTurnCredentials;
