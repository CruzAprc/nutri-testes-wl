import { supabase } from '../lib/supabase';
import type { ProgressPhoto } from '../types/database';

/**
 * Fetch all progress photos for a client, ordered by taken_at ascending.
 */
export async function getProgressPhotos(clientId: string) {
  return supabase
    .from('progress_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: true });
}

/**
 * Insert a new progress photo record.
 */
export async function insertProgressPhoto(photo: {
  client_id: string;
  photo_url: string;
  photo_type: ProgressPhoto['photo_type'];
  taken_at: string;
}) {
  return supabase.from('progress_photos').insert(photo).select().single();
}

/**
 * Delete a progress photo record by ID.
 */
export async function deleteProgressPhoto(photoId: string) {
  return supabase.from('progress_photos').delete().eq('id', photoId);
}

/**
 * Upload an image file to the progress-photos storage bucket.
 */
export async function uploadProgressFile(filePath: string, blob: Blob) {
  return supabase.storage.from('progress-photos').upload(filePath, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
}

/**
 * Get the public URL for a file in the progress-photos bucket.
 */
export function getProgressFileUrl(filePath: string) {
  return supabase.storage.from('progress-photos').getPublicUrl(filePath);
}

/**
 * Delete a file from the progress-photos storage bucket.
 */
export async function deleteProgressFile(filePath: string) {
  return supabase.storage.from('progress-photos').remove([filePath]);
}
