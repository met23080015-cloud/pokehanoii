"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useBowl } from "@/lib/store/bowl";

/**
 * Render tin nhắn AI: GIỮ in đậm **...** ở điểm nhấn, dọn các markdown thừa
 * (tiêu đề, code, id kỹ thuật) để output gọn gàng đồng nhất.
 */
function renderAssistant(content: string): React.ReactNode {
  const cleaned = content
    .replace(/```([\s\S]*?)```/g, "$1") // code block
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-+]\s+/gm, "• ") // bullets - + → •
    .replace(/^\s*\*(?!\*)\s+/gm, "• ") // bullet * (không phải **) → •
    .replace(/(?:poke|top|sauce|base|crisp|mixin)-[a-z-]+/g, "") // id lỡ lộ
    .replace(/\(\s*\)/g, "");

  return cleaned.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-bold text-brand-700">
          {bold[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { selection, totals, calorieTarget } = useBowl();
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ api: "/api/chat" });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      body: { bowl: { selection, totals, target: calorieTarget } },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="press fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-bar sm:bottom-6"
        aria-label="Tư vấn dinh dưỡng"
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div className="fade-in fixed bottom-44 right-4 z-40 flex h-[60vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-bar sm:bottom-24">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <span className="font-bold">🤖 Tư vấn dinh dưỡng</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="rounded-2xl bg-sand p-3 text-ink/55">
                Chào bạn! Hỏi mình cách build bát cân bằng nhé — vd: &quot;1000 calo
                nhiều đạm ít béo nên ăn gì?&quot;
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-left ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-sand text-ink/85"
                  }`}
                >
                  {m.role === "user" ? m.content : renderAssistant(m.content)}
                </span>
              </div>
            ))}
            {isLoading && <p className="text-ink/40">Đang soạn…</p>}
            {error && (
              <p className="text-red-500">Lỗi: AI chưa sẵn sàng (kiểm tra API key).</p>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex gap-2 border-t border-black/5 p-2.5"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Nhập câu hỏi…"
              className="flex-1 rounded-xl border border-black/10 bg-sand px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
