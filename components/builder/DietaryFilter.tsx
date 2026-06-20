"use client";

import type { DietFilter } from "@/lib/menu";

const OPTIONS: { id: DietFilter; label: string }[] = [
  { id: "vegan", label: "🌱 Món chay" },
  { id: "no-seafood", label: "🚫🦐 Không hải sản" },
];

export default function DietaryFilter({
  value,
  onChange,
}: {
  value: DietFilter[];
  onChange: (v: DietFilter[]) => void;
}) {
  const toggle = (id: DietFilter) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-ink/45">Lọc:</span>
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
          {o.label}
        </button>
      ))}
    </div>
  );
}
