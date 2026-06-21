import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// .trim(): tránh khoảng trắng thừa khi copy-paste env (space đầu key làm hỏng
// realtime — apikey nhét vào query param websocket sẽ thành "%20…" và bị từ chối).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;

/**
 * Singleton Supabase browser client (dùng cho realtime ở /admin).
 * Trả null nếu chưa cấu hình env — UI cần xử lý trường hợp này.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(url as string, anonKey as string, {
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return browserClient;
}
