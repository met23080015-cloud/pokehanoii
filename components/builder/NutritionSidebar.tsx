"use client";

import { useBowl } from "@/lib/store/bowl";
import { formatVND } from "@/lib/nutrition";
import { useT } from "@/lib/i18n";

export default function NutritionSidebar({ onCheckout }: { onCheckout: () => void }) {
  const { calorieTarget, totals } = useBowl();
  const t = useT();
  const remaining = calorieTarget - totals.kcal;
  const pct = calorieTarget > 0 ? Math.min(100, (totals.kcal / calorieTarget) * 100) : 0;
  const over = remaining < 0;
  const hasItems = totals.kcal > 0 || totals.price > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-bar backdrop-blur">
      <div className="mx-auto flex max-w-md flex-col gap-2.5">
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-ink/55 tabular-nums">
              {totals.kcal} / {calorieTarget} kcal
            </span>
            <span
              className={`font-semibold tabular-nums ${over ? "text-red-600" : "text-brand-600"}`}
            >
              {over
                ? t("builder.over", { n: Math.abs(remaining) })
                : t("builder.remaining", { n: remaining })}{" "}
              kcal
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${over ? "bg-red-500" : "bg-brand-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs font-medium text-ink/65">
          <span>🥩 {t("common.protein")} {totals.protein}g</span>
          <span>🧈 {t("common.fat")} {totals.fat}g</span>
          <span>🥦 {t("common.fiber")} {totals.fiber}g</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[11px] text-ink/45">{t("builder.subtotal")}</div>
            <div className="text-xl font-extrabold tracking-tight">
              {formatVND(totals.price)}
            </div>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!hasItems}
            className="press rounded-2xl bg-brand-600 px-6 py-3 font-bold text-white shadow-soft disabled:opacity-35"
          >
            {t("builder.viewOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
