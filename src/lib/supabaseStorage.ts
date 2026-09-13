import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let client: SupabaseClient | null = null;
let bucketReady = false;

function getClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
  }
  return client;
}

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  if (bucketReady) return;
  const { error: getError } = await supabase.storage.getBucket(env.supabaseStorageBucket);
  if (getError) {
    const { error: createError } = await supabase.storage.createBucket(env.supabaseStorageBucket, {
      public: true,
    });
    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }
  }
  bucketReady = true;
}

export async function uploadPublicFile(
  folder: string,
  file: { buffer: Buffer; originalname: string; mimetype: string }
): Promise<string> {
  const supabase = getClient();
  await ensureBucket(supabase);

  const ext = (file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".png").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload file: ${error.message}`);

  const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(path);
  return data.publicUrl;
}
