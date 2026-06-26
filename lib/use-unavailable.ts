"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RecipeRow } from "@/lib/stock";

/** Ngày hôm nay theo giờ VN (YYYY-MM-DD) — khớp cột date của ingredient_stock. */
function todayVN(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export interface StockState {
  /** Món KHÔNG khả dụng = 86 thủ công ∪ hết nguyên liệu (không làm nổi 1 phần). */
  unavailable: Set<string>;
  /** ingredient_id -> tồn còn lại hôm nay. Nguyên liệu chưa có dòng tồn = vô hạn (vắng mặt). */
  remaining: Map<string, number>;
  /** Công thức BOM (tĩnh) — dùng để tính số phần còn thêm được cho từng món. */
  recipes: RecipeRow[];
}

const EMPTY: StockState = { unavailable: new Set(), remaining: new Map(), recipes: [] };

/**
 * Trạng thái tồn kho realtime cho builder: tập món ẩn + tồn còn lại + công thức.
 * Trả EMPTY nếu chưa cấu hình Supabase. Nguyên liệu chưa có dòng tồn hôm nay = chưa giới hạn.
 */
export function useStock(): StockState {
  const [state, setState] = useState<StockState>(EMPTY);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let off = new Set<string>(); // 86 thủ công
    let recipes: RecipeRow[] = []; // tĩnh
    let stock = new Map<string, number>(); // ingredient_id -> remaining hôm nay

    const recompute = () => {
      if (!active) return;
      const unavailable = new Set<string>(off);
      for (const r of recipes) {
        const rem = stock.get(r.ingredient_id);
        if (rem !== undefined && rem < r.qty_per_unit) unavailable.add(r.item_id);
      }
      setState({ unavailable, remaining: new Map(stock), recipes });
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

  return state;
}

/** Chỉ tập món KHÔNG khả dụng (tương thích ngược). */
export function useUnavailable(): Set<string> {
  return useStock().unavailable;
}
