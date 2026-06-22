"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Ingredient } from "@/lib/supabase/types";

const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; // index = weekday 0..6
const todayDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
const todayWeekday = () => new Date(todayDate() + "T00:00:00").getDay();

/** Quản lý tồn kho: hạn mức theo thứ cho từng nguyên liệu + còn-lại-hôm-nay (realtime). */
export default function InventoryManager() {
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
    if (error) alert("Lưu thất bại — phiên đăng nhập có thể đã hết hạn.");
  }

  async function refill(id: string) {
    if (!supabase) return;
    const q = (quota[id] ?? [])[todayWeekday()] ?? 0;
    const { error } = await supabase
      .from("ingredient_stock")
      .upsert({ ingredient_id: id, date: todayDate(), remaining: q });
    if (error) alert("Nạp lại thất bại.");
    else loadStock();
  }

  if (!supabase) return <p className="text-sm text-amber-700">Supabase chưa cấu hình.</p>;

  const wdToday = todayWeekday();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink/55">
        Hạn mức theo thứ cho từng nguyên liệu. Hôm nay là <b>{WD[wdToday]}</b>. &quot;Còn lại&quot; cập
        nhật realtime khi có đơn. Hết → mọi món dùng nó tự ẩn ở builder.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink/50">
              <th className="px-3 py-2 text-left">Nguyên liệu</th>
              <th className="px-2 py-2">Còn hôm nay</th>
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
                      {saving === ing.id ? "..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => refill(ing.id)}
                      className="press ml-1 rounded-lg border border-brand-600 px-2.5 py-1 text-xs font-bold text-brand-700"
                    >
                      Nạp lại
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
