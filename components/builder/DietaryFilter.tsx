"use client";

import type { DietFilter } from "@/lib/menu";
import { useT } from "@/lib/i18n";

const OPTIONS: { id: DietFilter; labelKey: string }[] = [
  { id: "vegan", labelKey: "builder.filterVegan" },
  { id: "no-seafood", labelKey: "builder.filterNoSeafood" },
];

export default function DietaryFilter({
  value,
  onChange,
}: {
  value: DietFilter[];
  onChange: (v: DietFilter[]) => void;
}) {
  const t = useT();
  const toggle = (id: DietFilter) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-ink/45">{t("builder.filterLabel")}</span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => toggle(o.id)}
          className={`press rounded-full px-3 py-1 text-sm font-semibold ${
            value.includes(o.id)
              ? "bg-brand-600 text-white"
              : "bg-white text-ink/65 shadow-soft"
          }`}
        >
          {t(o.labelKey)}
        </button>
      ))}
    </div>
  );
}
