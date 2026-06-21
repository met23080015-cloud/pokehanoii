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

  const { error } = await supabase
    .from("service_requests")
    .insert({ table_no: tableNo, type: body.type, note });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
