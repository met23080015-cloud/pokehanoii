"use client";

import { getItem } from "@/lib/menu";
import { formatVND, type Totals } from "@/lib/nutrition";
import type { Selection } from "@/lib/nutrition";

export default function CheckoutSummary({
  selection,
  totals,
}: {
  selection: Selection;
  totals: Totals;
}) {
  const lines = Object.entries(selection).filter(([, q]) => (q || 0) > 0);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <h3 className="mb-2 font-bold tracking-tight">Bát của bạn</h3>
      <ul className="divide-y divide-black/5 text-sm">
        {lines.map(([id, qty]) => {
          const it = getItem(id);
          return (
            <li key={id} className="flex justify-between py-2">
              <span className="text-ink/80">
                {it?.vi ?? id}
                {qty > 1 && <span className="font-semibold text-brand-600"> ×{qty}</span>}
              </span>
              <span className="text-ink/45 tabular-nums">
                {Math.round((it?.kcal ?? 0) * qty)} kcal
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-sand p-2.5 text-center text-[11px] text-ink/55">
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.kcal}</div>kcal</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.protein}g</div>đạm</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.fat}g</div>béo</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.fiber}g</div>xơ</div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="font-semibold text-ink/70">Tổng cộng</span>
        <span className="text-xl font-extrabold tracking-tight">{formatVND(totals.price)}</span>
      </div>
    </div>
  );
}
