import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/nutrition";
import { getItem } from "@/lib/menu";
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
      { error: "Supabase chưa cấu hình (thiếu env)" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      table_no: body.table_no ?? null,
      items,
      total_kcal: totals.kcal,
      total_protein: totals.protein,
      total_fat: totals.fat,
      total_fiber: totals.fiber,
      total_price: totals.price,
      pay_method: payMethod,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, totals, pay_method: payMethod });
}
