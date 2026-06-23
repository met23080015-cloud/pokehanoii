"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ServiceRequest } from "@/lib/supabase/types";

// Mỗi instance hook mở 1 channel realtime riêng. Supabase định danh channel theo
// tên (topic) — nếu hai component (chuông + panel) trùng tên sẽ lỗi
// "cannot add postgres_changes callbacks after subscribe()". Nên cấp tên duy nhất.
let channelSeq = 0;

/**
 * Nguồn dữ liệu chung cho thông báo yêu cầu tại bàn (chuông + panel dashboard).
 * Tải danh sách đang mở, cập nhật realtime, sắp xếp CŨ → MỚI (xa nhất trước).
 * Dùng chung để tránh trùng logic giữa NotificationBell và ServiceRequestsPanel.
 */
export function useServiceRequests() {
  const [reqs, setReqs] = useState<ServiceRequest[]>([]);
  const supabase = getSupabaseClient();
  const channelName = useRef<string>("");
  if (!channelName.current) channelName.current = `service-requests-${++channelSeq}`;

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase
      .from("service_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: true }) // xa → gần (cũ trước)
      .then(({ data }) => {
        if (active) setReqs((data as ServiceRequest[]) ?? []);
      });

    const ch = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (p) => setReqs((prev) => [...prev, p.new as ServiceRequest]), // mới ở cuối
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests" },
        (p) => {
          const u = p.new as ServiceRequest;
          setReqs((prev) =>
            u.status !== "open"
              ? prev.filter((r) => r.id !== u.id)
              : prev.map((r) => (r.id === u.id ? u : r)),
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  async function resolve(id: string) {
    if (!supabase) return;
    let snap: ServiceRequest[] = [];
    setReqs((prev) => {
      snap = prev;
      return prev.filter((r) => r.id !== id);
    });
    const { error } = await supabase
      .from("service_requests")
      .update({ status: "done" })
      .eq("id", id);
    if (error) setReqs(snap); // rollback
  }

  return { reqs, resolve, enabled: !!supabase };
}

/** Thời gian tương đối "x phút trước" theo i18n. */
export function formatAgo(iso: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t("admin.justNow");
  if (mins < 60) return t("admin.minAgo", { n: mins });
  return t("admin.hourAgo", { n: Math.floor(mins / 60) });
}
