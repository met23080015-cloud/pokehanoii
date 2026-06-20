import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { buildSystemPrompt, type BowlContext } from "@/lib/ai/prompt";
import { rateLimit, clientKey } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("AI chưa cấu hình (thiếu OPENAI_API_KEY)", { status: 503 });
  }
  if (!rateLimit(clientKey(req))) {
    return new Response("Quá nhiều yêu cầu, thử lại sau.", { status: 429 });
  }

  let body: { messages: CoreMessage[]; bowl: BowlContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Body không hợp lệ", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(body.bowl),
    messages,
    temperature: 0.5,
  });

  return result.toDataStreamResponse();
}
