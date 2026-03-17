import path from "path";
import * as dotenv from 'dotenv';
dotenv.config();

type Config = {
    PORT: number | undefined;
    DEV_HOST: string | undefined;
    PROD_URL: string | undefined;
    DEV_URL: string | undefined;
    ENV: string | undefined;
    // Optional legacy database vars (for backward compatibility)
    DB_NAME?: string | undefined;
    DB_USER?: string | undefined;
    DB_PASSWORD?: string | undefined;
    DB_HOST?: string | undefined;
    DB_PORT?: number | undefined;
    DB_DIALECT?: string | undefined;
    // Required Supabase vars
    DATABASE_URL: string | undefined;
    DIRECT_URL: string | undefined;
    EMAIL_SERVICE: string | undefined;
    EMAIL_PORT: number | undefined;
    EMAIL_USER: string | undefined;
    EMAIL_FROM: string | undefined;
    EMAIL_PASS: string | undefined;
    EMAIL_HOST: string | undefined;
    PUBLIC_ROUTES: string[] | [];
    REDIS_INSTANCE_URL: string | undefined;
    REDIS_HOST: string | undefined;
    REDIS_PORT: number;
    REDIS_PASSWORD: string | undefined;
    TWILIO_ACCOUNT_SID: string | undefined;
    TWILIO_AUTH_TOKEN: string | undefined;
    TWILIO_PHONE_NUMBER: string | undefined;
    TWILIO_WHATSAPP_NUMBER: string | undefined;
    OTP_EXPIRY_TIME: number,
    TOKEN_SECRET: string;
    AZURE_STORAGE_CONNECTION_STRING: string | undefined;
    PAYSTACK_SECRET_KEY: string | undefined;
    CRYPTO_SECRET_KEY: string | undefined;
    CRYPTO_IV: string | undefined;
    SUPABASE_URL: string | undefined;
    SUPABASE_ANON_KEY: string | undefined;
    SUPABASE_SERVICE_ROLE_KEY: string | undefined;
};

const getConfig = (): Config => {
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


const getSanitzedConfig = (config: Config) => {
    const requiredKeys = ['PORT', 'DATABASE_URL', 'DIRECT_URL', 'TOKEN_SECRET'];
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined && requiredKeys.includes(key)) {
            throw new Error(`Missing required key ${key} in .env`);
        }
    }
    return config as Config;
};

const config = getConfig();
const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;
