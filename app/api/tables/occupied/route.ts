import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Danh sách số bàn ĐANG BẬN = có đơn chưa hoàn thành (status != 'done').
 * Anon không đọc được bảng orders (RLS) nên đi qua service role ở server.
 * Dùng để chặn khách chọn trùng bàn đang được phục vụ.
 */
export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ occupied: [] });

  const { data, error } = await supabase
    .from("orders")
    .select("table_no")
    .neq("status", "done");

  if (error) return NextResponse.json({ occupied: [] });

  const occupied = [
    ...new Set(
      (data ?? [])
        .map((r) => r.table_no as number | null)
        .filter((n): n is number => typeof n === "number"),
    ),
  ];
  return NextResponse.json({ occupied });
}
