"use client";

import type { PayMethod } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";

export default function OrderConfirmation({
  orderId,
  orderToken,
  tableNo,
  payMethod,
  onNewOrder,
}: {
  orderId: string;
  orderToken?: string;
  tableNo: number | null;
  payMethod: PayMethod;
  onNewOrder: () => void;
}) {
  const t = useT();
  const shortId = orderId.slice(0, 8).toUpperCase();
  return (
    <div className="fade-in flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-soft">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-4xl">
        🎉
      </div>
      <h2 className="text-xl font-extrabold tracking-tight">{t("order.sent")}</h2>
      <p className="text-sm text-ink/55">{t("order.yourOrderCode")}</p>
      <p className="rounded-xl bg-sand px-5 py-2 font-mono text-2xl font-bold tracking-widest text-brand-700">
        #{shortId}
      </p>
      {tableNo != null && (
        <p className="text-sm text-ink/70">
          {t("order.table")} <span className="font-bold text-ink">{tableNo}</span>
        </p>
      )}
      <p className="max-w-xs text-sm text-ink/55">
        {payMethod === "vietqr" ? t("order.noteVietQR") : t("order.noteCounter")}
      </p>
      {orderToken && (
        <a
          href={`/order/${orderToken}`}
          className="press rounded-2xl bg-brand-600 px-5 py-2.5 font-bold text-white shadow-soft"
        >
          {t("order.track")}
        </a>
      )}
      <button
        type="button"
        onClick={onNewOrder}
        className="press mt-1 rounded-2xl border border-brand-600 px-5 py-2.5 font-bold text-brand-700"
      >
        {t("order.newOrder")}
      </button>
    </div>
  );
}
