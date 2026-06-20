"use client";

import { useEffect, useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import { getItemGroup } from "@/lib/menu";
import { evaluateBalance } from "@/lib/nutrition";
import type { AnalyzeResult } from "@/lib/ai/schema";

export default function ReviewCard() {
  const { selection, totals, calorieTarget, setQty, toggle, selectSingle } = useBowl();
  const [ai, setAi] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);

  // Đánh giá deterministic (luôn có ngay, số do code tính)
  const local = evaluateBalance(totals);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAiFailed(false);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection, totals, target: calorieTarget }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: AnalyzeResult) => active && setAi(data))
      .catch(() => active && setAiFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSuggestion(itemId: string) {
    const g = getItemGroup(itemId);
    if (!g) return;
    if (g === "proteins") setQty(itemId, (selection[itemId] || 0) + 1);
    else if (g === "bases" || g === "sauces") selectSingle(g, itemId);
    else if (!selection[itemId]) toggle(itemId);
  }

  const score = ai?.score ?? local.score;
  const gaps = ai?.gaps?.length ? ai.gaps : local.gaps;

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-bold tracking-tight">
          <span>🤖</span> AI phân tích dinh dưỡng
        </h3>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-brand-700 shadow-soft tabular-nums">
          {score}
          <span className="text-ink/40">/100</span>
        </span>
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-black/5" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-black/5" />
        </div>
      )}

      {ai?.summary && <p className="mt-2 text-sm text-ink/75">{ai.summary}</p>}

      {gaps.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-ink/70">
          {gaps.map((g, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-brand-500">•</span>
              {g}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p className="mt-2 text-sm font-medium text-brand-700">Bát khá cân bằng 👍</p>
      )}

      {ai?.suggestions && ai.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-ink/45">Gợi ý thêm</p>
          <div className="flex flex-wrap gap-2">
            {ai.suggestions.map((s) => (
              <button
                key={s.itemId}
                type="button"
                onClick={() => addSuggestion(s.itemId)}
                title={s.reason}
                className="press rounded-full border border-brand-500 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700"
              >
                + {s.vi}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiFailed && (
        <p className="mt-2 text-xs text-ink/40">
          (AI chưa sẵn sàng — đang hiển thị phân tích cơ bản từ hệ thống.)
        </p>
      )}
    </div>
  );
}
