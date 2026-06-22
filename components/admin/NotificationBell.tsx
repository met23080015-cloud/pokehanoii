"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { ServiceRequest } from "@/lib/supabase/types";

const LABEL_KEY: Record<string, string> = {
  service: "admin.svcService",
  bill: "admin.svcBill",
  feedback: "admin.svcFeedback",
};

/**
 * Chuông thông báo (admin): gom yêu cầu tại bàn đang mở, realtime.
 * Dropdown sắp xếp CŨ → MỚI (xa nhất đến gần nhất) để xử lý theo thứ tự đến.
 */
export default function NotificationBell() {
  const t = useT();
  const [reqs, setReqs] = useState<ServiceRequest[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = getSupabaseClient();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase
      .from("service_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: true }) // xa → gần (cũ trước)
      .then(({ data }) => {
        if (active) setReqs((data as ServiceRequest[]) ?? []);
      });

    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (p) => setReqs((prev) => [...prev, p.new as ServiceRequest]), // mới ở cuối
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests" },
        (p) => {
          const u = p.new as ServiceRequest;
          setReqs((prev) =>
            u.status !== "open"
              ? prev.filter((r) => r.id !== u.id)
              : prev.map((r) => (r.id === u.id ? u : r)),
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  // Click ra ngoài → đóng dropdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function resolve(id: string) {
    if (!supabase) return;
    let snap: ServiceRequest[] = [];
    setReqs((prev) => {
      snap = prev;
      return prev.filter((r) => r.id !== id);
    });
    const { error } = await supabase
      .from("service_requests")
      .update({ status: "done" })
      .eq("id", id);
    if (error) setReqs(snap); // rollback
  }

  function ago(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return t("admin.justNow");
    if (mins < 60) return t("admin.minAgo", { n: mins });
    return t("admin.hourAgo", { n: Math.floor(mins / 60) });
  }

  const count = reqs.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("admin.notifTitle")}
        className="press relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-soft"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 max-w-[90vw] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-bar">
          <p className="px-2 py-1.5 text-sm font-bold text-ink">
            {t("admin.notifTitle")}
            {count > 0 && <span className="text-ink/40"> · {count}</span>}
          </p>
          {count === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink/40">
              {t("admin.notifEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {reqs.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 rounded-xl bg-sand p-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {r.table_no != null
                        ? `${t("common.table")} ${r.table_no}`
                        : t("admin.guest")}{" "}
                      · {LABEL_KEY[r.type] ? t(LABEL_KEY[r.type]) : r.type}
                    </p>
                    {r.note && (
                      <p className="break-words text-xs text-ink/55">{r.note}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink/40">{ago(r.created_at)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resolve(r.id)}
                    className="press shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t("admin.svcResolved")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
