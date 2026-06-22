"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type RecipeRow = { item_id: string; ingredient_id: string; qty_per_unit: number };

/** Ngày hôm nay theo giờ VN (YYYY-MM-DD) — khớp cột date của ingredient_stock. */
function todayVN(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Tập id món KHÔNG khả dụng = 86 thủ công ∪ hết nguyên liệu (tồn kho BOM hôm nay),
 * cập nhật realtime. Dùng ở builder để ẩn món. Trả Set rỗng nếu chưa cấu hình Supabase.
 * Nguyên liệu chưa có dòng tồn hôm nay = chưa giới hạn (vô hạn) → món vẫn hiện.
 */
export function useUnavailable(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let off = new Set<string>(); // 86 thủ công
    let recipes: RecipeRow[] = []; // tĩnh
    let stock = new Map<string, number>(); // ingredient_id -> remaining hôm nay

    const recompute = () => {
      if (!active) return;
      const out = new Set<string>(off);
      for (const r of recipes) {
        const rem = stock.get(r.ingredient_id);
        if (rem !== undefined && rem < r.qty_per_unit) out.add(r.item_id);
      }
      setIds(out);
    };

    const loadOff = () =>
      supabase
        .from("menu_unavailable")
        .select("item_id")
        .then(({ data }) => {
          off = new Set((data ?? []).map((r) => r.item_id as string));
          recompute();
        });

    const loadStock = () =>
      supabase
        .from("ingredient_stock")
        .select("ingredient_id, remaining")
        .eq("date", todayVN())
        .then(({ data }) => {
          stock = new Map((data ?? []).map((r) => [r.ingredient_id as string, Number(r.remaining)]));
          recompute();
        });

    // recipe tĩnh: tải 1 lần
    supabase
      .from("recipe")
      .select("item_id, ingredient_id, qty_per_unit")
      .then(({ data }) => {
        recipes = (data as RecipeRow[]) ?? [];
        recompute();
      });

    loadOff();
    loadStock();

    const ch = supabase
      .channel("menu-avail")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_unavailable" }, loadOff)
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredient_stock" }, loadStock)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  return ids;
}
