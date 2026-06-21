import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderLineItem } from "@/lib/supabase/types";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Lấy profile khẩu vị từ Bearer token trong request (tùy chọn).
 * Trả null nếu không có token / không hợp lệ / chưa có lịch sử.
 */
export async function customerProfile(req: Request): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const { data: u } = await supabase.auth.getUser(token);
  if (!u.user) return null;
  return buildCustomerProfile(supabase, u.user.id);
}

/**
 * Tóm tắt khẩu vị khách từ lịch sử đơn → 1 đoạn ngắn bơm vào prompt AI.
 * Trả null nếu chưa có lịch sử (khách mới / chưa login) → AI không cá nhân hóa.
 * Số liệu do code tính, AI chỉ diễn giải (giữ nguyên nguyên tắc grounding).
 */
export async function buildCustomerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("orders")
    .select("items, total_kcal")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const orders = (data as { items: OrderLineItem[]; total_kcal: number }[]) ?? [];
  if (orders.length === 0) return null;

  const m = new Map<string, { vi: string; qty: number }>();
  let kcalSum = 0;
  for (const o of orders) {
    kcalSum += o.total_kcal || 0;
    for (const it of o.items || []) {
      const c = m.get(it.id) || { vi: it.vi, qty: 0 };
      c.qty += it.qty || 0;
      m.set(it.id, c);
    }
  }
  const top = [...m.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4)
    .map((x) => x.vi)
    .join(", ");
  const avgKcal = Math.round(kcalSum / orders.length);

  return `Khách quen (đã đặt ${orders.length} đơn). Hay chọn: ${top || "—"}. Calo trung bình mỗi bát: ${avgKcal} kcal.`;
}
