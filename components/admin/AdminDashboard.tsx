"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import OrderCard from "./OrderCard";

export default function AdminDashboard() {
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
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) {
          setOrders((data as Order[]) ?? []);
          setReady(true);
        }
      });

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => setOrders((prev) => [payload.new as Order, ...prev]),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            updated.status === "done"
              ? prev.filter((o) => o.id !== updated.id)
              : prev.map((o) => (o.id === updated.id ? updated : o)),
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function updateStatus(id: string, status: OrderStatus) {
    if (!supabase) return;
    let snapshot: Order[] = [];
    // optimistic (giữ snapshot để rollback nếu lỗi)
    setOrders((prev) => {
      snapshot = prev;
      return status === "done"
        ? prev.filter((o) => o.id !== id)
        : prev.map((o) => (o.id === id ? { ...o, status } : o));
    });
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setOrders(snapshot); // rollback
      alert(
        "Cập nhật thất bại — phiên đăng nhập có thể đã hết hạn. Hãy đăng xuất và đăng nhập lại.",
      );
    }
  }

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
        Supabase chưa cấu hình (thiếu NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-ink/55">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        {ready ? `${orders.length} đơn đang xử lý` : "Đang tải…"} · cập nhật realtime
      </p>
      {orders.length === 0 && ready && (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center text-ink/40">
          Chưa có đơn nào.
        </p>
      )}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onStatus={updateStatus} />
      ))}
    </div>
  );
}
