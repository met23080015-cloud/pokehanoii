"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Tập id món tạm hết hàng (auto-86), cập nhật realtime.
 * Dùng ở builder để ẩn món; trả Set rỗng nếu chưa cấu hình Supabase.
 */
export function useUnavailable(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const load = () =>
      supabase
        .from("menu_unavailable")
        .select("item_id")
        .then(({ data }) => {
          if (active) setIds(new Set((data ?? []).map((r) => r.item_id as string)));
        });

    load();
    const ch = supabase
      .channel("menu-avail")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_unavailable" },
        load,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  return ids;
}
