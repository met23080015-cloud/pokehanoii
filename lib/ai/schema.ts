import { z } from "zod";

export const suggestionSchema = z.object({
  itemId: z.string().describe("id món trong menu (vd 'top-edamame')"),
  vi: z.string().describe("tên tiếng Việt của món"),
  reason: z.string().describe("lý do ngắn gọn nên thêm món này"),
});

export const analyzeSchema = z.object({
  score: z.number().min(0).max(100).describe("điểm cân bằng dinh dưỡng 0-100"),
  summary: z.string().describe("nhận xét tổng quan 1-2 câu, tiếng Việt"),
  gaps: z.array(z.string()).describe("danh sách điểm thiếu/dư (tiếng Việt)"),
  suggestions: z
    .array(suggestionSchema)
    .max(4)
    .describe("tối đa 4 món nên thêm, chỉ chọn từ menu được cung cấp"),
});

export type AnalyzeResult = z.infer<typeof analyzeSchema>;

/** AI insight kinh doanh cho admin — diễn giải số liệu thật, đề xuất hành động. */
export const insightSchema = z.object({
  headline: z.string().describe("nhận định tổng quan 1 câu, tiếng Việt"),
  observations: z
    .array(z.string())
    .max(4)
    .describe("3-4 quan sát ngắn rút ra từ số liệu (không bịa số)"),
  actions: z
    .array(
      z.object({
        title: z.string().describe("đề xuất hành động ngắn gọn"),
        detail: z.string().describe("giải thích 1 câu vì sao"),
      }),
    )
    .max(3)
    .describe("tối đa 3 đề xuất kinh doanh cụ thể"),
});

export type InsightResult = z.infer<typeof insightSchema>;
