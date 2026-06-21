import { requireStaff } from "@/lib/supabase/staff-auth";
import type { Order } from "@/lib/supabase/types";

export const runtime = "nodejs";

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Xuất CSV danh sách đơn (chỉ staff). Client fetch kèm Bearer token rồi tải blob. */
export async function GET(req: Request) {
  const staff = await requireStaff(req);
  if (!staff) return new Response("Chỉ dành cho nhân viên", { status: 403 });

  const { data } = await staff.supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);
  const orders = (data as Order[]) ?? [];

  const header = [
    "id", "thoi_gian", "ban", "mon", "calo", "dam_g", "gia_vnd",
    "thanh_toan", "trang_thai", "da_tra",
  ];
  const rows = orders.map((o) => [
    o.id.slice(0, 8),
    o.created_at,
    o.table_no ?? "",
    (o.items || []).map((i) => `${i.vi}${i.qty > 1 ? ` x${i.qty}` : ""}`).join("; "),
    o.total_kcal,
    o.total_protein,
    o.total_price,
    o.pay_method === "vietqr" ? "VietQR" : "Tại quầy",
    o.status,
    o.paid ? "rồi" : "chưa",
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");

  // BOM ﻿ để Excel đọc UTF-8 đúng tiếng Việt.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="poke-orders.csv"',
    },
  });
}
