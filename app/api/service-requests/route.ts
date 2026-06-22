import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ServiceRequestType } from "@/lib/supabase/types";

const TYPES: ServiceRequestType[] = ["service", "bill", "feedback"];

export async function POST(req: Request) {
  let body: { table_no?: number | null; type?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  if (!body.type || !TYPES.includes(body.type as ServiceRequestType)) {
    return NextResponse.json({ error: "Loại yêu cầu không hợp lệ" }, { status: 400 });
  }
  const tableNo =
    typeof body.table_no === "number" && body.table_no > 0
      ? Math.floor(body.table_no)
      : null;
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 300) || null : null;

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  // CHỐNG SPAM (server-side, không cần migration):
  // (1) Cooldown 30s: cùng bàn + cùng loại vừa gửi trong 30s → chặn.
  // (2) Chặn trùng đang mở (service/bill): đã có 1 yêu cầu cùng loại CHƯA xử lý
  //     thì không tạo thêm — tránh dồn "gọi phục vụ" x10 cho 1 bàn.
  // Feedback bỏ qua (2) vì khách có thể góp ý nhiều nội dung khác nhau.
  const COOLDOWN_MS = 30_000;
  const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
  let recentQuery = supabase
    .from("service_requests")
    .select("id, status, created_at")
    .eq("type", body.type)
    .order("created_at", { ascending: false })
    .limit(5);
  recentQuery =
    tableNo == null ? recentQuery.is("table_no", null) : recentQuery.eq("table_no", tableNo);
  const { data: recent } = await recentQuery;

  if (recent && recent.length > 0) {
    const tooSoon = recent.some((r) => (r.created_at as string) > since);
    const hasOpen = body.type !== "feedback" && recent.some((r) => r.status === "open");
    if (tooSoon || hasOpen) {
      return NextResponse.json(
        {
          error: "Yêu cầu đã được ghi nhận, nhân viên đang tới. Vui lòng đợi chút nhé.",
          code: "RATE_LIMIT",
        },
        { status: 429 },
      );
    }
  }

  const { error } = await supabase
    .from("service_requests")
    .insert({ table_no: tableNo, type: body.type, note });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
