import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/nutrition";
import { getItem, getItemGroup } from "@/lib/menu";
import type { CreateOrderPayload, OrderLineItem } from "@/lib/supabase/types";

export async function POST(req: Request) {
  let body: CreateOrderPayload;
  try {
    body = (await req.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const selection = body?.selection;
  if (!selection || typeof selection !== "object") {
    return NextResponse.json({ error: "Thiếu selection" }, { status: 400 });
  }
  const payMethod = body.pay_method === "vietqr" ? "vietqr" : "counter";
  const size = body.size === "extra" ? "extra" : "regular";

  // Đơn hợp lệ phải có ít nhất 1 lớp nền (basePrice luôn được cộng nên không thể
  // dựa vào price > 0 để bắt đơn rỗng — phải kiểm tra có món thật).
  const hasBase = Object.entries(selection).some(
    ([id, qty]) => (qty || 0) > 0 && getItemGroup(id) === "bases",
  );
  if (!hasBase) {
    return NextResponse.json(
      { error: "Cần chọn ít nhất 1 lớp nền" },
      { status: 400 },
    );
  }

  // Đọc cấu hình giá (admin sửa được); thiếu thì dùng mặc định menu.json.
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }
  const { data: cfg } = await supabase
    .from("menu_config")
    .select("base_price, extra_poke_fee")
    .eq("id", 1)
    .maybeSingle();
  const priceConfig = cfg
    ? { basePrice: cfg.base_price, extraPokeFee: cfg.extra_poke_fee }
    : undefined;

  // NGUỒN CHÂN LÝ: server tự tính lại totals, không tin client.
  const totals = computeTotals(selection, priceConfig, size);
  if (totals.price <= 0) {
    return NextResponse.json({ error: "Đơn trống" }, { status: 400 });
  }

  const items: OrderLineItem[] = Object.entries(selection)
    .filter(([, qty]) => (qty || 0) > 0)
    .map(([id, qty]) => {
      const it = getItem(id);
      return {
        id,
        vi: it?.vi ?? id,
        qty: qty as number,
        kcal: Math.round((it?.kcal ?? 0) * (qty as number)),
      };
    });

  // Cỡ Extra Poke → thêm 1 dòng để bếp/admin biết khách thêm phần đạm.
  if (size === "extra") {
    items.push({ id: "size-extra-poke", vi: "🔥 Extra Poke (thêm phần đạm)", qty: 1, kcal: 0 });
  }

  // Khách đăng nhập (tùy chọn): xác thực JWT → gắn user_id để tích điểm + lịch sử
  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const { data: u } = await supabase.auth.getUser(token);
    userId = u.user?.id ?? null;
  }

  // Trừ kho + tạo đơn ATOMIC qua RPC (chống oversell/race). Nguyên liệu hết → lỗi OUT_OF_STOCK.
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items,
    p_table_no: body.table_no ?? null,
    p_user_id: userId,
    p_total_kcal: totals.kcal,
    p_total_protein: totals.protein,
    p_total_fat: totals.fat,
    p_total_fiber: totals.fiber,
    p_total_price: totals.price,
    p_pay_method: payMethod,
    p_size: size,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("OUT_OF_STOCK:")) {
      const ten = msg.split("OUT_OF_STOCK:")[1]?.trim() || "Nguyên liệu";
      return NextResponse.json(
        { error: `Xin lỗi, ${ten} đã hết phần phục vụ hôm nay — vui lòng chọn món khác.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg || "Không tạo được đơn" }, { status: 500 });
  }

  const res = data as { id: string; order_token: string };

  // Điểm loyalty được cộng tự động qua DB trigger khi staff xác nhận "đã thanh toán"
  // (xem migration 0004) — không cộng ở đây để tránh farm đơn chưa trả.

  return NextResponse.json({
    id: res.id,
    order_token: res.order_token,
    totals,
    pay_method: payMethod,
  });
}
