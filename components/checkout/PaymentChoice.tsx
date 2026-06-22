"use client";

import { useT } from "@/lib/i18n";
import type { PayMethod } from "@/lib/supabase/types";

export default function PaymentChoice({
  value,
  onChange,
}: {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
}) {
  const t = useT();
  const opts: { id: PayMethod; label: string; desc: string }[] = [
    { id: "counter", label: t("checkout.payCounter"), desc: t("checkout.payCounterDesc") },
    { id: "vietqr", label: t("checkout.payVietQR"), desc: t("checkout.payVietQRDesc") },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`press rounded-2xl border p-3 text-left ${
            value === o.id
              ? "border-brand-500 bg-brand-50 shadow-soft"
              : "border-black/5 bg-white hover:border-brand-200"
          }`}
        >
          <div className="font-bold text-ink">{o.label}</div>
          <div className="mt-0.5 text-xs text-ink/50">{o.desc}</div>
        </button>
      ))}
    </div>
  );
}
