import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/nutrition";
import { getItem, getItemGroup } from "@/lib/menu";
import { getPriceConfig } from "@/lib/price-config-server";
import { MAX_TABLE, isValidTable } from "@/lib/tables";
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

  // Dine-in: bàn đến từ QR (?table=N) nên BẮT BUỘC có và phải trong 1..MAX_TABLE.
  if (!isValidTable(body.table_no)) {
    return NextResponse.json(
      { error: `Thiếu số bàn — vui lòng quét mã QR tại bàn (chỉ 1–${MAX_TABLE}).` },
      { status: 400 },
    );
  }

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
  const priceConfig = await getPriceConfig();

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

  // Đổi điểm: chỉ áp dụng khi khách đã đăng nhập; server kẹp trần (50% đơn + số điểm có).
  const pointsRedeem =
    userId && Number.isFinite(body.points_redeem) && (body.points_redeem ?? 0) > 0
      ? Math.floor(body.points_redeem as number)
      : 0;

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
    p_points_redeem: pointsRedeem,
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

  const res = data as {
    id: string;
    order_token: string;
    pay_code: string;
    total_price: number; // tổng RÒNG sau khi trừ điểm (server kẹp trần)
    points_redeemed: number;
  };

  // Điểm loyalty được cộng/trừ tự động qua DB trigger khi đơn được xác nhận "đã thanh toán"
  // (xem migration 0004 + 0010) — không xử lý ở đây để tránh farm đơn chưa trả.

  return NextResponse.json({
    id: res.id,
    order_token: res.order_token,
    pay_code: res.pay_code, // mã nhúng vào nội dung CK để SePay đối soát tự động
    // totals.price là tổng gốc; net_price là số tiền thực trả (đã trừ điểm) → dùng cho QR + màn chờ.
    totals: { ...totals, price: res.total_price },
    net_price: res.total_price,
    points_redeemed: res.points_redeemed,
    pay_method: payMethod,
  });
}
