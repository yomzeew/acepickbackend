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
exports.deleteFileFromSupabase = exports.uploadProductImagesToSupabase = exports.uploadAvatarToSupabase = exports.uploadFilesToSupabase = exports.uploadFileToSupabase = void 0;
const supabase_1 = require("../config/supabase");
// ─── Helpers ─────────────────────────────────────────────────
const getMimeType = (ext) => {
    const map = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
    };
    return map[ext] || 'application/octet-stream';
};
// ─── Core upload ─────────────────────────────────────────────
/**
 * Upload a single file buffer to Supabase Storage.
 * @param bucket - Supabase storage bucket name
 * @param buffer - File contents as a Buffer
 * @param originalName - Original filename (used to extract extension)
 * @param mimetype - MIME type of the file
 * @param folder - Optional subfolder within the bucket
 */
const uploadFileToSupabase = (bucket, buffer, originalName, mimetype, folder) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ext = ((_a = originalName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    const { data, error } = yield supabase_1.supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
    });
    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }
    const { data: urlData } = supabase_1.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
    return {
        url: urlData.publicUrl,
        path: data.path,
    };
});
exports.uploadFileToSupabase = uploadFileToSupabase;
/**
 * Upload multiple file buffers to Supabase Storage.
 */
const uploadFilesToSupabase = (bucket, files, folder) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield Promise.all(files.map((f) => (0, exports.uploadFileToSupabase)(bucket, f.buffer, f.originalName, f.mimetype, folder)));
    return results.map((r) => r.url);
});
exports.uploadFilesToSupabase = uploadFilesToSupabase;
// ─── Convenience wrappers ────────────────────────────────────
/**
 * Upload an avatar from a multer file.
 */
const uploadAvatarToSupabase = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.uploadFileToSupabase)(supabase_1.BUCKET, file.buffer, file.originalname, file.mimetype, supabase_1.FOLDERS.AVATARS);
    return result.url;
});
exports.uploadAvatarToSupabase = uploadAvatarToSupabase;
/**
 * Upload product images from multer files.
 */
const uploadProductImagesToSupabase = (files) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.uploadFilesToSupabase)(supabase_1.BUCKET, files.map((f) => ({
        buffer: f.buffer,
        originalName: f.originalname,
        mimetype: f.mimetype,
    })), supabase_1.FOLDERS.PRODUCTS);
});
exports.uploadProductImagesToSupabase = uploadProductImagesToSupabase;
/**
 * Delete a file from Supabase storage.
 */
const deleteFileFromSupabase = (bucket, path) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabase_1.supabase.storage.from(bucket).remove([path]);
    if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
    }
});
exports.deleteFileFromSupabase = deleteFileFromSupabase;
