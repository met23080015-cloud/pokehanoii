"use client";

import { formatVND } from "@/lib/nutrition";
import type { Order, OrderStatus } from "@/lib/supabase/types";

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Chờ nhận", cls: "bg-amber-100 text-amber-700" },
  accepted: { label: "Đang làm", cls: "bg-brand-100 text-brand-700" },
  done: { label: "Xong", cls: "bg-black/5 text-ink/50" },
};

export default function OrderCard({
  order,
  onStatus,
  onPaid,
}: {
  order: Order;
  onStatus: (id: string, status: OrderStatus) => void;
  onPaid: (id: string) => void;
}) {
  const time = new Date(order.created_at).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const st = STATUS[order.status];

  return (
    <div className="fade-in rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {order.table_no != null && (
            <span className="rounded-xl bg-brand-600 px-2.5 py-1 text-sm font-bold text-white">
              Bàn {order.table_no}
            </span>
          )}
          <span className="font-mono text-xs text-ink/35">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
            {st.label}
          </span>
          <span className="text-xs text-ink/35">{time}</span>
        </div>
      </div>

      <ul className="mt-2.5 text-sm text-ink/80">
        {order.items.map((it) => (
          <li key={it.id}>
            • {it.vi}
            {it.qty > 1 && <span className="font-semibold text-brand-600"> ×{it.qty}</span>}
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
        <span className="tabular-nums">{order.total_kcal} kcal</span>
        <span className="tabular-nums">đạm {order.total_protein}g</span>
        <span className="tabular-nums">xơ {order.total_fiber}g</span>
        <span className="rounded-full bg-sand px-2 py-0.5 font-medium">
          {order.pay_method === "vietqr" ? "VietQR" : "Tại quầy"}
        </span>
        {order.paid ? (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
            ✓ Đã thanh toán
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600">
            Chưa thanh toán
          </span>
        )}
        <span className="ml-auto text-base font-extrabold text-ink tabular-nums">
          {formatVND(order.total_price)}
        </span>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {!order.paid && (
          <button
            type="button"
            onClick={() => onPaid(order.id)}
            className="press rounded-xl border border-brand-600 px-4 py-2 text-sm font-bold text-brand-700"
          >
            Xác nhận đã trả
          </button>
        )}
        {order.status === "pending" && (
          <button
            type="button"
            onClick={() => onStatus(order.id, "accepted")}
            className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
          >
            Nhận đơn
          </button>
        )}
        {order.status === "accepted" && (
          <button
            type="button"
            onClick={() => onStatus(order.id, "done")}
            className="press rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
          >
            Hoàn thành
          </button>
        )}
      </div>
    </div>
  );
}
