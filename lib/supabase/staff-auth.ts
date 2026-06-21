import { getServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Xác thực 1 request là STAFF: lấy Bearer JWT → getUser → kiểm tra allowlist `staff`.
 * Trả { supabase, userId } nếu hợp lệ, null nếu không (route tự trả 401/403).
 */
export async function requireStaff(
  req: Request,
): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const { data: u } = await supabase.auth.getUser(token);
  const userId = u.user?.id;
  if (!userId) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!staff) return null;

  return { supabase, userId };
}
