"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLDERS = exports.BUCKET = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const configSetup_1 = __importDefault(require("./configSetup"));
// Use service role key for backend (bypasses RLS)
exports.supabase = (0, supabase_js_1.createClient)(configSetup_1.default.SUPABASE_URL || '', configSetup_1.default.SUPABASE_SERVICE_ROLE_KEY || '');
// Single storage bucket — all files go here, organized by folder
exports.BUCKET = 'Acepick';
// Folder prefixes within the bucket
exports.FOLDERS = {
    AVATARS: 'avatars',
    PRODUCTS: 'products',
    PORTFOLIOS: 'portfolios',
    GENERAL: 'general',
    CHAT: 'chat',
};
