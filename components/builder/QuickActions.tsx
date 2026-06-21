"use client";

import { useState } from "react";
import type { ServiceRequestType } from "@/lib/supabase/types";

const TILES: { type: ServiceRequestType; label: string; icon: string }[] = [
  { type: "service", label: "Gọi phục vụ", icon: "🙋" },
  { type: "bill", label: "Xin thanh toán", icon: "🧾" },
  { type: "feedback", label: "Góp ý", icon: "💬" },
];

/**
 * 3 ô thao tác nhanh gửi yêu cầu realtime về quầy (giống o2o iPOS).
 * "Góp ý" mở ô nhập ghi chú; còn lại gửi 1 chạm.
 */
export default function QuickActions({ tableNo }: { tableNo: number }) {
  const [sending, setSending] = useState<ServiceRequestType | null>(null);
  const [done, setDone] = useState<ServiceRequestType | null>(null);
  const [fbOpen, setFbOpen] = useState(false);
  const [note, setNote] = useState("");

  async function send(type: ServiceRequestType, noteText?: string) {
    setSending(type);
    try {
      const r = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_no: tableNo, type, note: noteText }),
      });
      if (!r.ok) throw new Error();
      setDone(type);
      setTimeout(() => setDone((d) => (d === type ? null : d)), 2600);
    } catch {
      alert("Gửi không thành công, thử lại nhé.");
    } finally {
      setSending(null);
    }
  }

  function onTile(type: ServiceRequestType) {
    if (type === "feedback") return setFbOpen(true);
    send(type);
  }

  return (
    <section>
      <div className="grid grid-cols-3 gap-2.5">
        {TILES.map((t) => {
          const isDone = done === t.type;
          const isSending = sending === t.type;
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => onTile(t.type)}
              disabled={isSending}
              className={`press flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center shadow-soft ${
                isDone
                  ? "border-brand-200 bg-brand-50"
                  : "border-black/5 bg-white"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {isDone ? "✅" : t.icon}
              </span>
              <span className="text-xs font-semibold text-ink/70">
                {isDone ? "Đã gửi" : isSending ? "Đang gửi…" : t.label}
              </span>
            </button>
          );
        })}
      </div>

      {fbOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="fade-in w-full max-w-md rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-sm font-bold text-ink">Góp ý cho quán</p>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Chia sẻ trải nghiệm hoặc yêu cầu của bạn…"
              className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-sand p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFbOpen(false);
                  setNote("");
                }}
                className="press flex-1 rounded-xl bg-sand py-2.5 text-sm font-semibold text-ink/60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!note.trim()}
                onClick={() => {
                  send("feedback", note.trim());
                  setFbOpen(false);
                  setNote("");
                }}
                className="press flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                Gửi góp ý
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
