"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT, useLang } from "@/lib/i18n";

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
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const { selection, totals, calorieTarget, size } = useBowl();
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
      body: { bowl: { selection, totals, target: calorieTarget, size }, lang },
    });
  };

  // --- Vị trí cửa sổ chat (bám theo nút robot, không kéo riêng) ---
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // --- Kéo thả nút robot (FAB) ---
  const fabRef = useRef<HTMLButtonElement>(null);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const fabDrag = useRef<{ ox: number; oy: number; dx: number; dy: number; moved: boolean } | null>(
    null,
  );

  function fabDown(e: React.PointerEvent) {
    if (!fabRef.current) return;
    const r = fabRef.current.getBoundingClientRect();
    fabDrag.current = {
      ox: e.clientX,
      oy: e.clientY,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      moved: false,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function fabMove(e: React.PointerEvent) {
    const d = fabDrag.current;
    if (!d || !fabRef.current) return;
    // chỉ tính là kéo khi vượt 6px → tránh nhầm thao tác chạm thành kéo
    if (!d.moved && Math.hypot(e.clientX - d.ox, e.clientY - d.oy) < 6) return;
    d.moved = true;
    const w = fabRef.current.offsetWidth;
    const h = fabRef.current.offsetHeight;
    const x = Math.max(8, Math.min(e.clientX - d.dx, window.innerWidth - w - 8));
    const y = Math.max(8, Math.min(e.clientY - d.dy, window.innerHeight - h - 8));
    setFabPos({ x, y });
  }
  function fabUp() {
    const moved = fabDrag.current?.moved;
    fabDrag.current = null;
    // không di chuyển = chạm → mở/đóng panel
    if (!moved) (open ? setOpen(false) : openPanel());
  }

  // Mở cửa sổ chat ngay cạnh nút robot: ưu tiên phía trên nút, thiếu chỗ thì
  // mở xuống dưới; căn mép phải theo nút và luôn kẹp trong màn hình.
  function openPanel() {
    const fab = fabRef.current?.getBoundingClientRect();
    const w = Math.min(384, window.innerWidth * 0.92);
    const h = window.innerHeight * 0.6;
    let x = window.innerWidth - w - 16;
    let y = Math.max(16, window.innerHeight - h - 96);
    if (fab) {
      x = Math.max(8, Math.min(fab.right - w, window.innerWidth - w - 8));
      const above = fab.top - h - 12;
      y = Math.max(8, above >= 8 ? above : Math.min(fab.bottom + 12, window.innerHeight - h - 8));
    }
    setPos({ x, y });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onPointerDown={fabDown}
        onPointerMove={fabMove}
        onPointerUp={fabUp}
        style={fabPos ? { left: fabPos.x, top: fabPos.y, right: "auto", bottom: "auto" } : undefined}
        className="press fixed bottom-28 right-4 z-40 flex h-14 w-14 cursor-move touch-none select-none items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-bar sm:bottom-6"
        aria-label={t("ai.fabLabel")}
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div
          style={pos ? { left: pos.x, top: pos.y } : undefined}
          className="fade-in fixed z-40 flex h-[60vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-bar"
        >
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <span className="font-bold">{t("ai.chatTitle")}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("ai.close")}>
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="rounded-2xl bg-sand p-3 text-ink/55">{t("ai.welcome")}</p>
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
            {isLoading && <p className="text-ink/40">{t("ai.typing")}</p>}
            {error && <p className="text-red-500">{t("ai.errChat")}</p>}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex gap-2 border-t border-black/5 p-2.5"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={t("ai.inputPlaceholder")}
              className="flex-1 rounded-xl border border-black/10 bg-sand px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {t("ai.send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
