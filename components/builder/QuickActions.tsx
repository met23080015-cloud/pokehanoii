"use client";

import { useState } from "react";
import type { ServiceRequestType } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";

const TILES: { type: ServiceRequestType; labelKey: string; icon: string }[] = [
  { type: "service", labelKey: "builder.callService", icon: "🙋" },
  { type: "bill", labelKey: "builder.askBill", icon: "🧾" },
  { type: "feedback", labelKey: "builder.feedback", icon: "💬" },
];

/**
 * 3 ô thao tác nhanh gửi yêu cầu realtime về quầy (giống o2o iPOS).
 * "Góp ý" mở ô nhập ghi chú; còn lại gửi 1 chạm.
 */
export default function QuickActions({ tableNo }: { tableNo: number }) {
  const t = useT();
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
      alert(t("builder.sendError"));
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
        {TILES.map((tile) => {
          const isDone = done === tile.type;
          const isSending = sending === tile.type;
          return (
            <button
              key={tile.type}
              type="button"
              onClick={() => onTile(tile.type)}
              disabled={isSending}
              className={`press flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center shadow-soft ${
                isDone
                  ? "border-brand-200 bg-brand-50"
                  : "border-black/5 bg-white"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {isDone ? "✅" : tile.icon}
              </span>
              <span className="text-xs font-semibold text-ink/70">
                {isDone
                  ? t("builder.sent")
                  : isSending
                    ? t("builder.sending")
                    : t(tile.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {fbOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="fade-in w-full max-w-md rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-sm font-bold text-ink">{t("builder.feedbackTitle")}</p>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t("builder.feedbackPlaceholder")}
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
                {t("common.cancel")}
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
                {t("builder.feedbackSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
