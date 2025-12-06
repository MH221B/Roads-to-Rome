import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

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
