"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const getConfig = () => {
    return {
        PORT: Number(process.env.PORT),
        DEV_HOST: process.env.DEV_HOST,
        DEV_URL: process.env.DEV_URL,
        PROD_URL: process.env.PROD_URL,
        ENV: process.env.ENV,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: Number(process.env.DB_PORT),
        DB_DIALECT: process.env.DB_DIALECT,
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
        EMAIL_SERVICE: process.env.EMAIL_SERVICE,
        EMAIL_PORT: Number(process.env.EMAIL_PORT),
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_FROM: process.env.EMAIL_FROM,
        EMAIL_PASS: process.env.EMAIL_PASS,
        EMAIL_HOST: process.env.EMAIL_HOST,
        OTP_EXPIRY_TIME: Number(process.env.OTP_EXPIRY_TIME || 5),
        TOKEN_SECRET: process.env.TOKEN_SECRET || 'supersecret',
        REDIS_INSTANCE_URL: process.env.REDIS_INSTANCE_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
        TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
        AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
        PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
        CRYPTO_SECRET_KEY: process.env.CRYPTO_SECRET_KEY,
        CRYPTO_IV: process.env.CRYPTO_IV,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        PUBLIC_ROUTES: [
            '/api',
            '/',
            '/api/auth/send-otp',
            '/api/auth/register',
            '/api/auth/verify-otp',
            '/api/auth/verify-token',
            '/api/auth/upload_avatar',
            '/api/auth/register-professional',
            '/api/auth/register-corperate',
            '/api/auth/register-rider',
            '/api/sectors',
            '/api/professions',
            '/api/professionals',
            '/api/auth/change-password-forgot',
            '/api/delete-users',
            '/api/auth/send-otp',
            '/api/auth/login',
            '/api/send-sms',
            '/api/send-email',
            '/api/notification-test',
            '/api/nearest-person',
            '/api/testN',
            '/api/fileupload',
            '/api/admin/send-invites',
            '/api/admin/get-invite',
            '/api/admin/reset-password',
            '/api/admin/update-invite',
            '/api/admin/check-email',
            "/api/admin/register",
            "/api/admin/login",
            "/api/paystack/webhook",
            "/api/auth/verify/webhook",
            "/api/public/products",
            "/api/public/categories"
        ],
    };
};
const getSanitzedConfig = (config) => {
    const requiredKeys = ['PORT', 'DATABASE_URL', 'DIRECT_URL', 'TOKEN_SECRET'];
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined && requiredKeys.includes(key)) {
            throw new Error(`Missing required key ${key} in .env`);
        }
    }
    return config;
};
const config = getConfig();
const sanitizedConfig = getSanitzedConfig(config);
exports.default = sanitizedConfig;
