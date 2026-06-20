import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client dùng SERVICE ROLE (bỏ qua RLS) cho thao tác
 * insert đơn + đọc lại order_token. BẮT BUỘC có SUPABASE_SERVICE_ROLE_KEY:
 * sau khi siết RLS, anon không có quyền SELECT nên INSERT...RETURNING sẽ hỏng.
 * Trả null nếu chưa cấu hình → route trả 503 (fail loud, không hỏng âm thầm).
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
