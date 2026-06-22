"use client";

import type { MenuItem } from "@/lib/menu";
import { formatVND } from "@/lib/nutrition";

interface Props {
  item: MenuItem;
  qty: number;
  mode: "single" | "multi" | "qty";
  onToggle: () => void;
  onInc: () => void;
  onDec: () => void;
}

export default function ItemCard({ item, qty, mode, onToggle, onInc, onDec }: Props) {
  const selected = qty > 0;

  return (
    <div
      className={`press relative flex flex-col gap-1 rounded-2xl border p-3 text-left ${
        selected
          ? "border-brand-500 bg-brand-50 shadow-soft"
          : "border-black/5 bg-white hover:border-brand-200"
      }`}
    >
      {selected && mode !== "qty" && (
        <span className="pointer-events-none absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white shadow-soft">
          ✓
        </span>
      )}

      <button
        type="button"
        onClick={mode === "qty" ? onInc : onToggle}
        className="flex flex-col gap-0.5 text-left"
      >
        {item.image && (
          <div className="-mx-3 -mt-3 mb-1 overflow-hidden rounded-t-2xl bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.vi}
              loading="lazy"
              className="h-20 w-full object-cover"
            />
          </div>
        )}
        <span className="font-semibold leading-tight text-ink">{item.vi}</span>
        <span className="text-[11px] text-ink/40">{item.en}</span>
      </button>

      <div className="mt-1 flex items-center justify-between text-[11px] text-ink/55">
        <span className="font-medium">
          {item.kcal ?? 0} kcal{item.grams ? ` · ${item.grams}g` : ""}
        </span>
        {item.price ? (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
            {formatVND(item.price)}
          </span>
        ) : item.premiumFee ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
            +{formatVND(item.premiumFee)}
          </span>
        ) : null}
      </div>

      {mode === "qty" && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-ink/50">{item.protein ?? 0}g đạm</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDec}
              disabled={qty <= 0}
              aria-label="Bớt"
              className="press flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-lg leading-none text-ink/70 disabled:opacity-25"
            >
              −
            </button>
            <span className="w-5 text-center font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={onInc}
              aria-label="Thêm"
              className="press flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-lg leading-none text-white"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
