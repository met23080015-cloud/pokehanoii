"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { Ingredient } from "@/lib/supabase/types";

// index = weekday 0..6 (CN..T7) → key trong dict
const WD_KEYS = ["wdSun", "wdMon", "wdTue", "wdWed", "wdThu", "wdFri", "wdSat"] as const;
const todayDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
const todayWeekday = () => new Date(todayDate() + "T00:00:00").getDay();

/** Quản lý tồn kho: hạn mức theo thứ cho từng nguyên liệu + còn-lại-hôm-nay (realtime). */
export default function InventoryManager() {
  const t = useT();
  const WD = WD_KEYS.map((k) => t(`admin.${k}`));
  const supabase = getSupabaseClient();
  const [ings, setIngs] = useState<Ingredient[]>([]);
  const [quota, setQuota] = useState<Record<string, number[]>>({}); // id -> [7]
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadStock = useCallback(() => {
    if (!supabase) return;
    supabase
      .from("ingredient_stock")
      .select("ingredient_id, remaining")
      .eq("date", todayDate())
      .then(({ data }) =>
        setRemaining(
          Object.fromEntries((data ?? []).map((r) => [r.ingredient_id as string, Number(r.remaining)])),
        ),
      );
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("ingredient")
      .select("id, name_vi, unit")
      .order("id")
      .then(({ data }) => setIngs((data as Ingredient[]) ?? []));
    supabase
      .from("ingredient_quota")
      .select("ingredient_id, weekday, quota_amount")
      .then(({ data }) => {
        const q: Record<string, number[]> = {};
        (data ?? []).forEach((r) => {
          const id = r.ingredient_id as string;
          q[id] = q[id] ?? Array(7).fill(0);
          q[id][r.weekday as number] = Number(r.quota_amount);
        });
        setQuota(q);
      });
    loadStock();
    const ch = supabase
      .channel("inv-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredient_stock" }, loadStock)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, loadStock]);

  function setQ(id: string, wd: number, v: number) {
    setQuota((p) => {
      const arr = (p[id] ?? Array(7).fill(0)).slice();
      arr[wd] = v;
      return { ...p, [id]: arr };
    });
  }

  async function save(id: string) {
    if (!supabase) return;
    setSaving(id);
    const arr = quota[id] ?? Array(7).fill(0);
    const rows = arr.map((q, wd) => ({ ingredient_id: id, weekday: wd, quota_amount: q }));
    const { error } = await supabase.from("ingredient_quota").upsert(rows);
    setSaving(null);
    if (error) alert(t("admin.invSaveFailed"));
  }

  async function refill(id: string) {
    if (!supabase) return;
    const q = (quota[id] ?? [])[todayWeekday()] ?? 0;
    const { error } = await supabase
      .from("ingredient_stock")
      .upsert({ ingredient_id: id, date: todayDate(), remaining: q });
    if (error) alert(t("admin.invRefillFailed"));
    else loadStock();
  }

  if (!supabase)
    return <p className="text-sm text-amber-700">{t("admin.supabaseMissing")}</p>;

  const wdToday = todayWeekday();

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-sm text-ink/55"
        dangerouslySetInnerHTML={{ __html: t("admin.invHint", { today: WD[wdToday] }) }}
      />
      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink/50">
              <th className="px-3 py-2 text-left">{t("admin.invColIngredient")}</th>
              <th className="px-2 py-2">{t("admin.invColToday")}</th>
              {WD.map((d, i) => (
                <th key={d} className={`px-1 py-2 ${i === wdToday ? "font-bold text-brand-700" : ""}`}>
                  {d}
                </th>
              ))}
              <th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {ings.map((ing) => {
              const arr = quota[ing.id] ?? Array(7).fill(0);
              const rem = remaining[ing.id];
              return (
                <tr key={ing.id} className="border-t border-black/5">
                  <td className="px-3 py-1.5">
                    <span className="font-semibold">{ing.name_vi}</span>{" "}
                    <span className="text-ink/40">({ing.unit})</span>
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold tabular-nums">{rem ?? "—"}</td>
                  {arr.map((q, wd) => (
                    <td key={wd} className="px-1 py-1">
                      <input
                        type="number"
                        value={q}
                        onChange={(e) => setQ(ing.id, wd, Number(e.target.value))}
                        className="w-12 rounded-lg border border-black/10 bg-sand px-1.5 py-1 text-center tabular-nums focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1">
                    <button
                      type="button"
                      onClick={() => save(ing.id)}
                      disabled={saving === ing.id}
                      className="press rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {saving === ing.id ? "..." : t("common.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => refill(ing.id)}
                      className="press ml-1 rounded-lg border border-brand-600 px-2.5 py-1 text-xs font-bold text-brand-700"
                    >
                      {t("admin.invRefill")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
