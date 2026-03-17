import multer from "multer";

// Use memory storage so file buffers are available for Supabase upload
const storage = multer.memoryStorage();

export const uploads = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

