"use client";

import { useBowl } from "@/lib/store/bowl";
import { useT } from "@/lib/i18n";

const PRESETS = [600, 800, 1000, 1200];

export default function CalorieTarget() {
  const { calorieTarget, setTarget } = useBowl();
  const t = useT();

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <h2 className="text-sm font-semibold text-ink/60">{t("builder.calorieTitle")}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setTarget(p)}
            className={`press rounded-full px-4 py-1.5 text-sm font-semibold ${
              calorieTarget === p
                ? "bg-brand-600 text-white"
                : "bg-sand text-ink/70 hover:bg-brand-50"
            }`}
          >
            {p} kcal
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-sm text-ink/60">
          <span>{t("builder.calorieCustom")}</span>
          <input
            type="number"
            min={200}
            max={3000}
            step={50}
            value={calorieTarget}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
            className="w-20 rounded-xl border border-black/10 bg-sand px-2 py-1 text-right font-semibold tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
      </div>
    </section>
  );
}
