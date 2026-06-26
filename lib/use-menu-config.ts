"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PriceConfig } from "@/lib/nutrition";

/**
 * Cấu hình giá từ bảng menu_config, cập nhật realtime.
 * Trả undefined cho tới khi tải xong → computeTotals dùng mặc định menu.json.
 */
export function useMenuConfig(): PriceConfig | undefined {
  const [config, setConfig] = useState<PriceConfig | undefined>(undefined);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const load = () =>
      supabase
        .from("menu_config")
        .select("base_price, extra_poke_fee, extra_base_fee, extra_topping_fee")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data)
            setConfig({
              basePrice: data.base_price,
              extraPokeFee: data.extra_poke_fee,
              extraBaseFee: data.extra_base_fee,
              extraToppingFee: data.extra_topping_fee,
            });
        });
    load();
    const ch = supabase
      .channel("menu-config")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_config" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  return config;
}
