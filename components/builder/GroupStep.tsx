"use client";

import { groups, GROUP_LABELS, type GroupKey } from "@/lib/menu";
import { useBowl } from "@/lib/store/bowl";
import ItemCard from "./ItemCard";

interface Props {
  step: number;
  groupKey: GroupKey;
  mode: "single" | "multi" | "qty";
  help?: string;
}

export default function GroupStep({ step, groupKey, mode, help }: Props) {
  const { selection, toggle, setQty, selectSingle } = useBowl();
  const items = groups[groupKey];

  return (
    <section className="scroll-mt-4" id={`step-${groupKey}`}>
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">{GROUP_LABELS[groupKey]}</h2>
          {help && <p className="text-xs text-ink/50">{help}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((item) => {
          const qty = selection[item.id] || 0;
          return (
            <ItemCard
              key={item.id}
              item={item}
              qty={qty}
              mode={mode}
              onToggle={() =>
                mode === "single"
                  ? selectSingle(groupKey, item.id)
                  : toggle(item.id)
              }
              onInc={() => setQty(item.id, qty + 1)}
              onDec={() => setQty(item.id, Math.max(0, qty - 1))}
            />
          );
        })}
      </div>
    </section>
  );
}
