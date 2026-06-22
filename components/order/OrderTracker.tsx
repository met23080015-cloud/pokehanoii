"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/nutrition";
import { LogoMark } from "@/components/brand/Logo";
import { useT } from "@/lib/i18n";
import type { Order, OrderStatus } from "@/lib/supabase/types";

const STEPS: { key: OrderStatus; labelKey: string; descKey: string }[] = [
  { key: "pending", labelKey: "order.stepSentLabel", descKey: "order.stepSentDesc" },
  { key: "accepted", labelKey: "order.stepMakingLabel", descKey: "order.stepMakingDesc" },
  { key: "done", labelKey: "order.stepDoneLabel", descKey: "order.stepDoneDesc" },
];

export default function OrderTracker({ token }: { token: string }) {
  const t = useT();
  const supabase = getSupabaseClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const fetchOrder = async () => {
      const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
      if (active) {
        setOrder((Array.isArray(data) ? data[0] : data) ?? null);
        setLoaded(true);
      }
    };
    fetchOrder();
    const id = setInterval(fetchOrder, 4000); // poll trạng thái
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [supabase, token]);

  if (!loaded) return <p className="p-6 text-center text-ink/40">{t("order.loading")}</p>;
  if (!order)
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-soft">
        <p className="text-ink/60">{t("order.notFound")}</p>
      </div>
    );

  const activeIdx = STEPS.findIndex((s) => s.key === order.status);
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-extrabold tracking-tight text-brand-700">
          <LogoMark className="h-7 w-7 text-brand-600" /> Poke Hanoi
        </span>
        {order.table_no != null && (
          <span className="rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">
            {t("order.table")} {order.table_no}
          </span>
        )}
      </header>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <p className="text-sm text-ink/55">{t("order.orderCode")}</p>
        <p className="font-mono text-xl font-bold tracking-wider text-brand-700">#{shortId}</p>

        {/* timeline */}
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, i) => {
            const done = i <= activeIdx;
            const current = i === activeIdx;
            return (
              <li key={s.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done ? "bg-brand-600 text-white" : "bg-sand text-ink/40"
                  } ${current ? "ring-2 ring-brand-300" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div>
                  <div className={`font-semibold ${done ? "text-ink" : "text-ink/40"}`}>
                    {t(s.labelKey)}
                  </div>
                  <div className="text-xs text-ink/45">{t(s.descKey)}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <h3 className="mb-2 font-bold tracking-tight">{t("order.orderedItems")}</h3>
        <ul className="divide-y divide-black/5 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between py-1.5">
              <span>
                {it.vi}
                {it.qty > 1 && <span className="text-brand-600"> ×{it.qty}</span>}
              </span>
              <span className="text-ink/45">{it.kcal} kcal</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-black/5 pt-3 font-bold">
          <span>{t("order.total")}</span>
          <span>{formatVND(order.total_price)}</span>
        </div>
        <div className="mt-1 flex items-center justify-end gap-2 text-xs">
          <span className="text-ink/45">
            {order.pay_method === "vietqr" ? t("order.payVietQR") : t("order.payCounter")}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              order.paid ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {order.paid ? t("order.paid") : t("order.unpaid")}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-ink/35">{t("order.autoRefresh")}</p>
    </div>
  );
}
