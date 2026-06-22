"use client";

import { useBowl } from "@/lib/store/bowl";
import { formatVND } from "@/lib/nutrition";
import { pricing } from "@/lib/menu";

/** Chọn cỡ bát: Vừa (Regular) hoặc Extra Poke (+phụ phí, thêm 1 phần đạm). */
export default function SizeSelector() {
  const { size, setSize, config } = useBowl();
  const base = config?.basePrice ?? pricing.basePrice;
  const extra = config?.extraPokeFee ?? pricing.extraPokeFee;

  const options = [
    {
      key: "regular" as const,
      title: "Bát vừa (Regular)",
      desc: "Khẩu phần tiêu chuẩn",
      price: formatVND(base),
    },
    {
      key: "extra" as const,
      title: "Bát Extra Poke",
      desc: "Thêm 1 phần đạm",
      price: `+ ${formatVND(extra)}`,
    },
  ];

  return (
    <section className="scroll-mt-4">
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          ★
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Cỡ bát</h2>
          <p className="text-xs text-ink/50">Giá cơ bản đã gồm 1 phần đạm.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {options.map((o) => {
          const active = size === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setSize(o.key)}
              aria-pressed={active}
              className={`press flex flex-col gap-0.5 rounded-2xl border p-3 text-left shadow-soft transition ${
                active
                  ? "border-brand-600 bg-brand-50 ring-2 ring-brand-500/30"
                  : "border-black/5 bg-white"
              }`}
            >
              <span className="text-sm font-bold tracking-tight text-ink">{o.title}</span>
              <span className="text-xs text-ink/50">{o.desc}</span>
              <span
                className={`mt-1 text-sm font-extrabold tabular-nums ${
                  active ? "text-brand-700" : "text-ink/70"
                }`}
              >
                {o.price}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
