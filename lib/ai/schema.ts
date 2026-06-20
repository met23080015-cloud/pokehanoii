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
