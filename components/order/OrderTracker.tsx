"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/nutrition";
import { LogoMark } from "@/components/brand/Logo";
import type { Order, OrderStatus } from "@/lib/supabase/types";

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "pending", label: "Đã gửi", desc: "Đơn đã tới quầy" },
  { key: "accepted", label: "Đang làm", desc: "Bếp đang chuẩn bị" },
  { key: "done", label: "Hoàn thành", desc: "Mời bạn nhận món" },
];

export default function OrderTracker({ token }: { token: string }) {
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

  if (!loaded) return <p className="p-6 text-center text-ink/40">Đang tải đơn…</p>;
  if (!order)
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-soft">
        <p className="text-ink/60">Không tìm thấy đơn này.</p>
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
            Bàn {order.table_no}
          </span>
        )}
      </header>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <p className="text-sm text-ink/55">Mã đơn</p>
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
                    {s.label}
                  </div>
                  <div className="text-xs text-ink/45">{s.desc}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <h3 className="mb-2 font-bold tracking-tight">Món đã đặt</h3>
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
          <span>Tổng</span>
          <span>{formatVND(order.total_price)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-ink/45">
          {order.pay_method === "vietqr" ? "Chuyển khoản VietQR" : "Trả tại quầy"}
        </p>
      </div>

      <p className="text-center text-xs text-ink/35">Trang tự cập nhật mỗi vài giây.</p>
    </div>
  );
}
