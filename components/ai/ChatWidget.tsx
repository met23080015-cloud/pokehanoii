"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import { getSupabaseClient } from "@/lib/supabase/client";

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
  const [token, setToken] = useState<string | undefined>();
  const { selection, totals, calorieTarget } = useBowl();
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ api: "/api/chat" });

  // Lấy token phiên (nếu khách đã đăng nhập) để AI cá nhân hóa theo lịch sử.
  useEffect(() => {
    getSupabaseClient()
      ?.auth.getSession()
      .then(({ data }) => setToken(data.session?.access_token));
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: { bowl: { selection, totals, target: calorieTarget } },
    });
  };

  // --- Kéo thả panel ---
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  function openPanel() {
    if (!pos) {
      const w = Math.min(384, window.innerWidth * 0.92);
      const h = window.innerHeight * 0.6;
      setPos({
        x: window.innerWidth - w - 16,
        y: Math.max(16, window.innerHeight - h - 96),
      });
    }
    setOpen(true);
  }

  function startDrag(e: React.PointerEvent) {
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function moveDrag(e: React.PointerEvent) {
    if (!drag.current || !panelRef.current) return;
    const w = panelRef.current.offsetWidth;
    const h = panelRef.current.offsetHeight;
    const x = Math.max(8, Math.min(e.clientX - drag.current.dx, window.innerWidth - w - 8));
    const y = Math.max(8, Math.min(e.clientY - drag.current.dy, window.innerHeight - h - 8));
    setPos({ x, y });
  }
  function endDrag() {
    drag.current = null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="press fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-bar sm:bottom-6"
        aria-label="Tư vấn dinh dưỡng"
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
          className="fade-in fixed z-40 flex h-[60vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-bar"
        >
          <div
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            className="flex touch-none cursor-move select-none items-center justify-between bg-brand-600 px-4 py-3 text-white"
          >
            <span className="flex items-center gap-2 font-bold">
              <span className="opacity-70" aria-hidden>
                ⠿
              </span>
              🤖 Tư vấn dinh dưỡng
            </span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
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
