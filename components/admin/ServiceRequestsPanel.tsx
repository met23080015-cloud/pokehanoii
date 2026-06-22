"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { ServiceRequest } from "@/lib/supabase/types";

const LABEL_KEY: Record<string, string> = {
  service: "admin.svcService",
  bill: "admin.svcBill",
  feedback: "admin.svcFeedback",
};

/** Bảng yêu cầu tại bàn (realtime) — hiện nổi bật trên đầu dashboard admin. */
export default function ServiceRequestsPanel() {
  const t = useT();
  const [reqs, setReqs] = useState<ServiceRequest[]>([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase
      .from("service_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setReqs((data as ServiceRequest[]) ?? []);
      });

    const ch = supabase
      .channel("svc-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (p) => setReqs((prev) => [p.new as ServiceRequest, ...prev]),
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

  if (reqs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-bold text-amber-700">
        {t("admin.svcCount", { count: reqs.length })}
      </p>
      {reqs.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 shadow-soft"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {r.table_no != null ? `${t("common.table")} ${r.table_no}` : t("admin.guest")} ·{" "}
              {LABEL_KEY[r.type] ? t(LABEL_KEY[r.type]) : r.type}
            </p>
            {r.note && <p className="truncate text-xs text-ink/55">{r.note}</p>}
          </div>
          <button
            type="button"
            onClick={() => resolve(r.id)}
            className="press shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            {t("admin.svcResolved")}
          </button>
        </div>
      ))}
    </div>
  );
}
