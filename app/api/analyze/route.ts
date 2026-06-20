import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { analyzeSchema } from "@/lib/ai/schema";
import { buildAnalyzePrompt, type BowlContext } from "@/lib/ai/prompt";
import { rateLimit, clientKey } from "@/lib/ai/rate-limit";
import { computeTotals } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI chưa cấu hình" }, { status: 503 });
  }
  if (!rateLimit(clientKey(req))) {
    return NextResponse.json({ error: "Quá nhiều yêu cầu" }, { status: 429 });
  }

  let bowl: BowlContext;
  try {
    bowl = (await req.json()) as BowlContext;
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  // NGUỒN CHÂN LÝ: tính lại totals server-side, không tin số client gửi.
  const safeBowl: BowlContext = {
    selection: bowl?.selection ?? {},
    target: bowl?.target ?? 0,
    totals: computeTotals(bowl?.selection ?? {}),
  };

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: analyzeSchema,
      prompt: buildAnalyzePrompt(safeBowl),
      temperature: 0.3,
    });
    return NextResponse.json(object);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi phân tích" },
      { status: 500 },
    );
  }
}
