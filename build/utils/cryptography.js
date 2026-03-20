"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMessage = exports.encryptMessage = void 0;
const crypto_1 = __importDefault(require("crypto"));
const configSetup_1 = __importDefault(require("../config/configSetup"));
const SECRET_KEY = Buffer.from(configSetup_1.default.CRYPTO_SECRET_KEY || 'thisisaverysecurekey123456789012', "utf8").subarray(0, 32);
const IV = Buffer.from(configSetup_1.default.CRYPTO_IV || '1234567890123456', "utf8").subarray(0, 16);
const encryptMessage = (message) => {
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};
exports.encryptMessage = encryptMessage;
const decryptMessage = (encryptedData) => {
    try {
        const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    catch (_a) {
        // Message was stored as plain text or encrypted with a different key
        return encryptedData;
    }
};
exports.decryptMessage = decryptMessage;
