import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { extractPayCode, isValidSePayPayload } from "@/lib/payment/sepay";

// Webhook nhận tiền từ SePay → tự đánh dấu đơn đã thanh toán.
// Bảo mật: SePay gửi header "Authorization: Apikey <key>" (cấu hình trong dashboard).
// So khớp với SEPAY_WEBHOOK_API_KEY (server-only). Phải trả 2xx trong <5s, nếu không SePay retry.

export const runtime = "nodejs";

/** So sánh chuỗi an toàn theo thời gian (chống timing attack). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expectedKey) {
    // Chưa cấu hình key → từ chối thay vì chạy ở chế độ không bảo mật.
    return NextResponse.json({ success: false, error: "Webhook chưa cấu hình" }, { status: 503 });
  }

  // Header dạng "Apikey <key>". Chấp nhận cả "ApiKey"/"apikey".
  const auth = req.headers.get("authorization") || "";
  const provided = auth.replace(/^apikey\s+/i, "");
  if (!provided || !safeEqual(provided, expectedKey)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    // Body hỏng → coi như đã nhận để SePay không retry vô ích.
    return NextResponse.json({ success: true, ignored: "bad_body" });
  }

  if (!isValidSePayPayload(payload)) {
    return NextResponse.json({ success: true, ignored: "invalid_payload" });
  }

  // Chỉ xử lý tiền VÀO. Tiền ra (out) bỏ qua.
  if (payload.transferType !== "in") {
    return NextResponse.json({ success: true, ignored: "not_incoming" });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    // Lỗi cấu hình server → trả 500 để SePay retry (có cơ hội xử lý lại sau khi sửa).
    return NextResponse.json({ success: false, error: "Server chưa cấu hình" }, { status: 500 });
  }

  const payCode = extractPayCode(payload.content);

  const { data, error } = await supabase.rpc("confirm_sepay_payment", {
    p_sepay_id: payload.id,
    p_amount: payload.transferAmount,
    p_content: payload.content ?? null,
    p_reference: payload.referenceCode ?? null,
    p_gateway: payload.gateway ?? null,
    p_pay_code: payCode,
    p_raw: payload as unknown as Record<string, unknown>,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // data = { status: 'matched'|'unmatched'|'duplicate', order_id }
  return NextResponse.json({ success: true, ...(data as object) });
}
