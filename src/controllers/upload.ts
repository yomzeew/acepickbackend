import { Request, Response } from "express"
import { handleResponse, successResponse } from "../utils/modules"
import {
    uploadFileToSupabase,
    uploadFilesToSupabase,
    uploadAvatarToSupabase,
    uploadProductImagesToSupabase,
} from "../services/supabaseStorage";
import { BUCKET, FOLDERS } from "../config/supabase";

/**
 * Upload multiple files (e.g. product images) to Supabase Storage.
 * Expects multer memory storage with req.files populated.
 */
export const uploadFiles = async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return handleResponse(res, 400, false, 'No files uploaded');
    }

    const files = req.files as Express.Multer.File[];

    try {
        const urls = await uploadProductImagesToSupabase(files);
        return successResponse(res, 'success', { urls });
    } catch (error: any) {
        console.error('Upload files error:', error.message);
        return handleResponse(res, 500, false, error.message || 'Error uploading files');
    }
}

/**
 * Upload a single generic file to Supabase Storage.
 * Expects multer memory storage with req.file populated.
 */
export const uploadFile = async (req: Request, res: Response) => {
    if (!req.file) {
        return handleResponse(res, 400, false, 'No file uploaded');
    }

    const file = req.file as Express.Multer.File;

    try {
        const result = await uploadFileToSupabase(
            BUCKET,
            file.buffer,
            file.originalname,
            file.mimetype,
            FOLDERS.GENERAL,
        );
        return successResponse(res, 'success', { url: result.url });
    } catch (error: any) {
        console.error('Upload file error:', error.message);
        return handleResponse(res, 500, false, error.message || 'Error uploading file');
    }
}

/**
 * Upload an avatar to Supabase Storage.
 * Expects multer memory storage with req.file populated (field: 'avatar').
 */
export const uploadAvatar = async (req: Request, res: Response) => {
    if (!req.file) {
        return handleResponse(res, 400, false, 'No file uploaded');
    }

    const file = req.file as Express.Multer.File;

    try {
        const url = await uploadAvatarToSupabase(file);
        return successResponse(res, 'success', { url });
    } catch (error: any) {
        console.error('Upload avatar error:', error.message);
        return handleResponse(res, 500, false, error.message || 'Error uploading file');
    }
}