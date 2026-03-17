import { supabase, BUCKET, FOLDERS } from '../config/supabase';

// ─── Types ───────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  path: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const getMimeType = (ext: string): string => {
  const map: Record<string, string> = {
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
export const uploadFileToSupabase = async (
  bucket: string,
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder?: string,
): Promise<UploadResult> => {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
};

/**
 * Upload multiple file buffers to Supabase Storage.
 */
export const uploadFilesToSupabase = async (
  bucket: string,
  files: Array<{ buffer: Buffer; originalName: string; mimetype: string }>,
  folder?: string,
): Promise<string[]> => {
  const results = await Promise.all(
    files.map((f) =>
      uploadFileToSupabase(bucket, f.buffer, f.originalName, f.mimetype, folder),
    ),
  );
  return results.map((r) => r.url);
};

// ─── Convenience wrappers ────────────────────────────────────

/**
 * Upload an avatar from a multer file.
 */
export const uploadAvatarToSupabase = async (
  file: Express.Multer.File,
): Promise<string> => {
  const result = await uploadFileToSupabase(
    BUCKET,
    file.buffer,
    file.originalname,
    file.mimetype,
    FOLDERS.AVATARS,
  );
  return result.url;
};

/**
 * Upload product images from multer files.
 */
export const uploadProductImagesToSupabase = async (
  files: Express.Multer.File[],
): Promise<string[]> => {
  return uploadFilesToSupabase(
    BUCKET,
    files.map((f) => ({
      buffer: f.buffer,
      originalName: f.originalname,
      mimetype: f.mimetype,
    })),
    FOLDERS.PRODUCTS,
  );
};

/**
 * Delete a file from Supabase storage.
 */
export const deleteFileFromSupabase = async (
  bucket: string,
  path: string,
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
};
