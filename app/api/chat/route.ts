import { openai } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { z } from "zod";
import { buildSystemPrompt, type BowlContext } from "@/lib/ai/prompt";
import { rateLimit, clientKey } from "@/lib/ai/rate-limit";
import { computeTotals } from "@/lib/nutrition";
import { customerProfile } from "@/lib/ai/profile";
import { suggestBowl, type SuggestedBowl } from "@/lib/ai/suggest-bowl";
import { getUnavailableIds } from "@/lib/ai/inventory-server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Gọn lại cho AI: tên món theo ngôn ngữ + cỡ + tổng (KHÔNG lộ id kỹ thuật). */
function trimBowl(b: SuggestedBowl | null, lang: "vi" | "en") {
  if (!b) return null;
  const t = b.totals;
  const en = lang === "en";
  return {
    items: b.items.map((it) => ({ name: en ? it.en : it.vi, qty: it.qty })),
    size: en
      ? b.size === "extra"
        ? "Extra Poke (extra protein)"
        : "Regular"
      : b.size === "extra"
        ? "Extra Poke (thêm 1 phần đạm)"
        : "Vừa (Regular)",
    kcal: t.kcal,
    protein: t.protein,
    fat: t.fat,
    fiber: t.fiber,
    price: t.price,
  };
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("AI chưa cấu hình (thiếu OPENAI_API_KEY)", { status: 503 });
  }
  if (!rateLimit(clientKey(req))) {
    return new Response("Quá nhiều yêu cầu, thử lại sau.", { status: 429 });
  }

  let body: { messages: CoreMessage[]; bowl: BowlContext; lang?: "vi" | "en" };
  try {
    body = await req.json();
  } catch {
    return new Response("Body không hợp lệ", { status: 400 });
  }

  // Chỉ nhận user/assistant — chặn client tự chèn role:"system" (prompt injection).
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12);

  // NGUỒN CHÂN LÝ: tính lại totals server-side (không tin số client gửi) + tránh
  // crash khi body thiếu totals.
  const size = body.bowl?.size === "extra" ? "extra" : "regular";
  const safeBowl: BowlContext = {
    selection: body.bowl?.selection ?? {},
    target: body.bowl?.target ?? 0,
    size,
    totals: computeTotals(body.bowl?.selection ?? {}, undefined, size),
  };

  const lang = body.lang === "en" ? "en" : "vi";

  // Cá nhân hóa (tùy chọn): nếu khách đã đăng nhập → tóm tắt khẩu vị từ lịch sử.
  const profile = await customerProfile(req);

  // Công cụ tối ưu bowl theo ràng buộc (hướng C): AI parse ý → gọi tool chạy
  // solver deterministic → AI diễn giải. AI KHÔNG tự tính tổ hợp/giá.
  const suggestBowlTool = tool({
    description:
      "Tìm tổ hợp poke bowl RẺ NHẤT đáp ứng ràng buộc của khách (ngân sách tối đa, " +
      "calo tối thiểu, đạm tối thiểu). Dùng khi khách hỏi kiểu 'với X tiền mà vẫn đủ " +
      "Y calo / Z gram đạm thì ăn gì'. Trả về bowl gợi ý (đã loại món hết hàng) hoặc " +
      "phương án gần nhất nếu không khả thi. CHỈ truyền ràng buộc khách thực sự nêu.",
    parameters: z.object({
      budget: z.number().optional().describe("Ngân sách tối đa cho 1 bowl, đơn vị VND"),
      kcalTarget: z.number().optional().describe("Mức calo tối thiểu cần đạt (kcal)"),
      proteinMin: z.number().optional().describe("Lượng đạm tối thiểu cần đạt (gram)"),
      diet: z
        .array(z.enum(["vegan", "no-seafood"]))
        .optional()
        .describe("Bộ lọc ăn kiêng nếu khách yêu cầu: chay / không hải sản"),
    }),
    execute: async ({ budget, kcalTarget, proteinMin, diet }) => {
      // Lưới an toàn: model đôi khi parse "120k" thành 120. Không bát nào < 2000đ
      // nên giá trị nhỏ chắc chắn là đơn vị "nghìn" → quy về VND.
      if (budget != null && budget > 0 && budget < 2000) budget *= 1000;
      const excludeIds = await getUnavailableIds();
      const r = suggestBowl({ budget, kcalTarget, proteinMin, diet, excludeIds });
      return {
        feasible: r.feasible,
        params: r.params,
        bowl: trimBowl(r.bowl, lang),
        goalMin: trimBowl(r.goalMin, lang),
        nearest: trimBowl(r.nearest, lang),
      };
    },
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(safeBowl, profile, lang),
    messages,
    temperature: 0.5,
    tools: { suggestBowl: suggestBowlTool },
    maxSteps: 4,
  });

  return result.toDataStreamResponse();
}
