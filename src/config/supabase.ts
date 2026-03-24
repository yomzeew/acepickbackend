import { createClient } from '@supabase/supabase-js';
import config from './configSetup';

// Use service role key for backend (bypasses RLS)
export const supabase = createClient(
  config.SUPABASE_URL || '',
  config.SUPABASE_SERVICE_ROLE_KEY || '',
);

// Single storage bucket — all files go here, organized by folder
export const BUCKET = 'Acepick';

// Folder prefixes within the bucket
export const FOLDERS = {
  AVATARS: 'avatars',
  PRODUCTS: 'products',
  PORTFOLIOS: 'portfolios',
  GENERAL: 'general',
  CHAT: 'chat',
  RECORDINGS: 'recordings',
} as const;
