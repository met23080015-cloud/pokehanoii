"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { computeAnalytics, type Analytics } from "@/lib/analytics";
import { formatVND } from "@/lib/nutrition";
import { getItem, itemName } from "@/lib/menu";
import { useT, useLang } from "@/lib/i18n";
import type { Order } from "@/lib/supabase/types";
import AiInsight from "./AiInsight";
import ExportButton from "./ExportButton";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-soft">
      <p className="text-[11px] font-medium text-ink/45">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <h2 className="mb-3 text-sm font-bold text-ink/70">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 truncate text-ink/70">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-ink/60">{suffix}</span>
    </div>
  );
}

export default function AnalyticsView() {
  const t = useT();
  const { lang } = useLang();
  const supabase = getSupabaseClient();
  const [a, setA] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let on = true;
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (on) setA(computeAnalytics((data as Order[]) ?? []));
      });
    return () => {
      on = false;
    };
  }, [supabase]);

  if (!a) return <p className="p-6 text-center text-ink/40">{t("admin.loadingData")}</p>;
  if (a.summary.orderCount === 0)
    return (
      <p className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center text-ink/40">
        {t("admin.noOrdersStats")}
      </p>
    );

  const maxItem = a.topItems[0]?.qty || 1;
  const maxDay = Math.max(...a.revenueByDay.map((d) => d.revenue), 1);
  const maxHour = Math.max(...a.peakHours, 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ExportButton />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label={t("admin.kpiRevenue")} value={formatVND(a.summary.revenue)} />
        <Kpi
          label={t("admin.kpiOrdersPaid")}
          value={`${a.summary.orderCount} / ${a.summary.paidCount}`}
        />
        <Kpi label={t("admin.kpiAvgOrder")} value={formatVND(a.summary.avgOrderValue)} />
        <Kpi
          label={t("admin.kpiAvgKcal")}
          value={t("admin.kpiAvgKcalValue", { kcal: a.summary.avgKcal })}
        />
      </div>

      <AiInsight />

      <div className="grid gap-4 lg:grid-cols-2">
      <Card title={t("admin.cardTopItems")}>
        {a.topItems.map((it) => {
          const m = getItem(it.id);
          return (
            <Bar
              key={it.id}
              label={m ? itemName(m, lang) : it.vi}
              value={it.qty}
              max={maxItem}
              suffix={`${it.qty}`}
            />
          );
        })}
      </Card>

      <Card title={t("admin.cardRevenueByDay")}>
        {a.revenueByDay.map((d) => (
          <Bar key={d.day} label={d.day.slice(5)} value={d.revenue} max={maxDay} suffix={formatVND(d.revenue)} />
        ))}
      </Card>

      <div className="lg:col-span-2">
      <Card title={t("admin.cardPayPeak")}>
        <p
          className="text-sm text-ink/70"
          dangerouslySetInnerHTML={{
            __html: t("admin.payMixLine", {
              counter: a.payMix.counter,
              vietqr: a.payMix.vietqr,
            }),
          }}
        />
        <div className="mt-2 flex items-end gap-0.5">
          {a.peakHours.map((c, h) => (
            <div key={h} className="flex-1" title={t("admin.hourTitle", { hour: h, count: c })}>
              <div className="rounded-t bg-brand-400" style={{ height: `${(c / maxHour) * 48 + 2}px` }} />
              {h % 6 === 0 && <p className="mt-0.5 text-center text-[9px] text-ink/40">{h}h</p>}
            </div>
          ))}
        </div>
      </Card>
      </div>
      </div>
    </div>
  );
}
