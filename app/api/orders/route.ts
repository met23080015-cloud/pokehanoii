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

  // NGUỒN CHÂN LÝ: server tự tính lại totals, không tin client.
  const totals = computeTotals(selection);
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

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  // Khách đăng nhập (tùy chọn): xác thực JWT → gắn user_id để tích điểm + lịch sử
  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const { data: u } = await supabase.auth.getUser(token);
    userId = u.user?.id ?? null;
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      table_no: body.table_no ?? null,
      user_id: userId,
      items,
      total_kcal: totals.kcal,
      total_protein: totals.protein,
      total_fat: totals.fat,
      total_fiber: totals.fiber,
      total_price: totals.price,
      pay_method: payMethod,
      status: "pending",
    })
    .select("id, order_token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Điểm loyalty được cộng tự động qua DB trigger khi staff xác nhận "đã thanh toán"
  // (xem migration 0004) — không cộng ở đây để tránh farm đơn chưa trả.

  return NextResponse.json({
    id: data.id,
    order_token: data.order_token,
    totals,
    pay_method: payMethod,
  });
}
