import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars not fully configured: SUPABASE_URL or SUPABASE_SERVICE_KEY missing'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function uploadImageToSupabase(
  bucketName: string,
  filePath: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase is not configured on the server side');
  }

  // Upload the file buffer to the specified bucket/path
  const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
    contentType: contentType ?? 'application/octet-stream',
    upsert: true,
  });

  if (uploadError) {
    throw uploadError;
  }

  // Get the public URL (Synchronous in Supabase v2)
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Extract the file path from a Supabase public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/bucket/path/file.mp4 -> path/file.mp4
 */
function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    // Find 'public' in the path and extract everything after it
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex >= 0) {
      return pathParts.slice(publicIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteFileFromSupabase(bucketName: string, publicUrl: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase is not configured on the server side');
  }

  const filePath = extractFilePathFromUrl(publicUrl);
  if (!filePath) {
    // URL format might be invalid, skip deletion
    return;
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);
  if (error) {
    // Log but don't throw - file might not exist
    // eslint-disable-next-line no-console
    console.warn(`Failed to delete file from ${bucketName}: ${filePath}`, error);
  }
}
