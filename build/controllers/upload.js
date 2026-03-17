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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadFile = exports.uploadFiles = void 0;
const modules_1 = require("../utils/modules");
const supabaseStorage_1 = require("../services/supabaseStorage");
const supabase_1 = require("../config/supabase");
/**
 * Upload multiple files (e.g. product images) to Supabase Storage.
 * Expects multer memory storage with req.files populated.
 */
const uploadFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.files || req.files.length === 0) {
        return (0, modules_1.handleResponse)(res, 400, false, 'No files uploaded');
    }
    const files = req.files;
    try {
        const urls = yield (0, supabaseStorage_1.uploadProductImagesToSupabase)(files);
        return (0, modules_1.successResponse)(res, 'success', { urls });
    }
    catch (error) {
        console.error('Upload files error:', error.message);
        return (0, modules_1.handleResponse)(res, 500, false, error.message || 'Error uploading files');
    }
});
exports.uploadFiles = uploadFiles;
/**
 * Upload a single generic file to Supabase Storage.
 * Expects multer memory storage with req.file populated.
 */
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return (0, modules_1.handleResponse)(res, 400, false, 'No file uploaded');
    }
    const file = req.file;
    try {
        const result = yield (0, supabaseStorage_1.uploadFileToSupabase)(supabase_1.BUCKET, file.buffer, file.originalname, file.mimetype, supabase_1.FOLDERS.GENERAL);
        return (0, modules_1.successResponse)(res, 'success', { url: result.url });
    }
    catch (error) {
        console.error('Upload file error:', error.message);
        return (0, modules_1.handleResponse)(res, 500, false, error.message || 'Error uploading file');
    }
});
exports.uploadFile = uploadFile;
/**
 * Upload an avatar to Supabase Storage.
 * Expects multer memory storage with req.file populated (field: 'avatar').
 */
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return (0, modules_1.handleResponse)(res, 400, false, 'No file uploaded');
    }
    const file = req.file;
    try {
        const url = yield (0, supabaseStorage_1.uploadAvatarToSupabase)(file);
        return (0, modules_1.successResponse)(res, 'success', { url });
    }
    catch (error) {
        console.error('Upload avatar error:', error.message);
        return (0, modules_1.handleResponse)(res, 500, false, error.message || 'Error uploading file');
    }
});
exports.uploadAvatar = uploadAvatar;
