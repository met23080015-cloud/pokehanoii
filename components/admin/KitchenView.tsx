"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/supabase/types";

/** Tiếng chuông ngắn khi có đơn mới (Web Audio — không cần file asset). */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.18);
  } catch {
    /* trình duyệt chặn audio trước tương tác — bỏ qua */
  }
}

/** Màn hình bếp (KDS): đơn đang làm realtime, chuông khi có đơn mới, nút lớn. */
export default function KitchenView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("orders")
      .select("*")
      .neq("status", "done")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setOrders((data as Order[]) ?? []);
          setReady(true);
        }
      });
    const ch = supabase
      .channel("kds")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        setOrders((prev) => [...prev, p.new as Order]);
        beep();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (p) => {
        const u = p.new as Order;
        setOrders((prev) =>
          u.status === "done" ? prev.filter((o) => o.id !== u.id) : prev.map((o) => (o.id === u.id ? u : o)),
        );
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  async function setStatus(id: string, status: OrderStatus) {
    if (!supabase) return;
    let snap: Order[] = [];
    setOrders((prev) => {
      snap = prev;
      return status === "done"
        ? prev.filter((o) => o.id !== id)
        : prev.map((o) => (o.id === id ? { ...o, status } : o));
    });
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) setOrders(snap);
  }

  if (!supabase) return <p className="text-sm text-amber-700">Supabase chưa cấu hình.</p>;

  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm text-ink/55">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        🍳 {ready ? `${orders.length} đơn đang chờ` : "Đang tải…"} · chuông khi có đơn mới
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className={`fade-in rounded-2xl border-2 p-4 ${
              o.status === "pending" ? "border-amber-300 bg-amber-50" : "border-brand-300 bg-brand-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-ink">
                {o.table_no != null ? `Bàn ${o.table_no}` : "Mang đi"}
              </span>
              <span className="text-xs text-ink/40">
                {new Date(o.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <ul className="mt-2 text-base text-ink/85">
              {o.items.map((it) => (
                <li key={it.id}>
                  • {it.vi}
                  {it.qty > 1 && <b className="text-brand-600"> ×{it.qty}</b>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              {o.status === "pending" && (
                <button
                  type="button"
                  onClick={() => setStatus(o.id, "accepted")}
                  className="press rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white"
                >
                  Nhận làm
                </button>
              )}
              {o.status === "accepted" && (
                <button
                  type="button"
                  onClick={() => setStatus(o.id, "done")}
                  className="press rounded-xl bg-ink px-5 py-2.5 font-bold text-white"
                >
                  Xong ✓
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && ready && (
          <p className="col-span-full rounded-2xl border border-dashed border-black/10 p-10 text-center text-ink/40">
            Chưa có đơn nào.
          </p>
        )}
      </div>
    </div>
  );
}
