import { createClient } from '@supabase/supabase-js';
import { TypedSupabaseClient, Database } from './supabase-types';

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create type-safe client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Create an admin client using the service key
 * Only use server-side in API routes or server components
 */
export function createAdminClient(): TypedSupabaseClient {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing environment variable SUPABASE_SERVICE_KEY');
  }
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

/**
 * Get user profile data from Supabase
 * @param {string} userId - The user ID to fetch profile for
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user profile in Supabase
 * @param {string} userId - User ID to update
 * @param {object} updates - Object containing profile fields to update
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
  return data;
}

/**
 * Upload a file to Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path within the bucket
 * @param {File} file - File object to upload
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;
  return data;
}

/**
 * Get a public URL for a file in Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to the file within the bucket
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}
