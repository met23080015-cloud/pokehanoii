import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { insightSchema } from "@/lib/ai/schema";
import { buildAdminInsightPrompt } from "@/lib/ai/prompt";
import { computeAnalytics } from "@/lib/analytics";
import { requireStaff } from "@/lib/supabase/staff-auth";
import type { Order } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI chưa cấu hình" }, { status: 503 });
  }
  const staff = await requireStaff(req);
  if (!staff) {
    return NextResponse.json({ error: "Chỉ dành cho nhân viên" }, { status: 403 });
  }

  // Số liệu do code tính server-side từ đơn thật (AI chỉ diễn giải).
  const { data } = await staff.supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const analytics = computeAnalytics((data as Order[]) ?? []);

  if (analytics.summary.orderCount === 0) {
    return NextResponse.json({ error: "Chưa có dữ liệu đơn để phân tích" }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: insightSchema,
      prompt: buildAdminInsightPrompt(analytics),
      temperature: 0.4,
    });
    return NextResponse.json(object);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi tạo insight" },
      { status: 500 },
    );
  }
}
