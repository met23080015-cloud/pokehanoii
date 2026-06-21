"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { InsightResult } from "@/lib/ai/schema";

/** Khối AI insight kinh doanh (P3) — gọi /api/ai/insight với token staff. */
export default function AiInsight() {
  const supabase = getSupabaseClient();
  const [data, setData] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!supabase) return;
    setLoading(true);
    setErr(null);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    try {
      const r = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error((await r.json()).error || "Lỗi tạo insight");
      setData(await r.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-brand-700">🤖 Nhận định AI</p>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="press shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {loading ? "Đang phân tích…" : data ? "Phân tích lại" : "Tạo nhận định"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {data && (
        <div className="mt-3 flex flex-col gap-2.5 text-sm">
          <p className="font-semibold text-ink">{data.headline}</p>
          <ul className="list-disc pl-5 text-ink/70">
            {data.observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5">
            {data.actions.map((ac, i) => (
              <div key={i} className="rounded-xl bg-white p-2.5 shadow-soft">
                <p className="text-sm font-semibold text-brand-700">→ {ac.title}</p>
                <p className="text-xs text-ink/55">{ac.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
