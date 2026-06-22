"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { groups, GROUP_LABELS, type GroupKey } from "@/lib/menu";

/** Auto-86: bật/tắt món hết hàng. Tắt → builder của khách ẩn ngay (realtime). */
export default function MenuManager() {
  const supabase = getSupabaseClient();
  const [off, setOff] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const load = () =>
      supabase
        .from("menu_unavailable")
        .select("item_id")
        .then(({ data }) => {
          if (active) setOff(new Set((data ?? []).map((r) => r.item_id as string)));
        });
    load();
    const ch = supabase
      .channel("menu-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_unavailable" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  async function toggle(id: string) {
    if (!supabase) return;
    setBusy(id);
    const isOff = off.has(id);
    const next = new Set(off);
    isOff ? next.delete(id) : next.add(id);
    setOff(next); // optimistic
    const res = isOff
      ? await supabase.from("menu_unavailable").delete().eq("item_id", id)
      : await supabase.from("menu_unavailable").insert({ item_id: id });
    if (res.error) {
      setOff(off); // rollback
      alert("Cập nhật thất bại — phiên đăng nhập có thể đã hết hạn.");
    }
    setBusy(null);
  }

  if (!supabase) {
    return <p className="text-sm text-amber-700">Supabase chưa cấu hình.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink/55">
        Tắt món tạm hết hàng — builder của khách sẽ ẩn món đó <b>ngay lập tức</b>.
      </p>
      {(Object.keys(groups) as GroupKey[]).map((g) => (
        <section key={g}>
          <h2 className="mb-2 text-sm font-bold text-ink/70">{GROUP_LABELS[g]}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {groups[g].map((it) => {
              const isOff = off.has(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => toggle(it.id)}
                  className={`press flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-sm shadow-soft disabled:opacity-50 ${
                    isOff ? "border-red-200 bg-red-50" : "border-black/5 bg-white"
                  }`}
                >
                  <span className={isOff ? "text-ink/40 line-through" : "font-medium text-ink"}>
                    {it.vi}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isOff ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {isOff ? "Hết" : "Còn"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
