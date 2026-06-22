import { getServerSupabase } from "@/lib/supabase/server";

/** Ngày hôm nay theo giờ VN (YYYY-MM-DD) — khớp cột date của ingredient_stock. */
function todayVN(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

type RecipeRow = { item_id: string; ingredient_id: string; qty_per_unit: number };

/**
 * Tập id món KHÔNG khả dụng hôm nay = 86 thủ công ∪ hết nguyên liệu (BOM),
 * tính server-side (bản song song của lib/use-unavailable cho phía API).
 * Trả [] nếu chưa cấu hình Supabase hoặc lỗi → solver vẫn chạy với menu đầy đủ.
 */
export async function getUnavailableIds(): Promise<string[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];
  try {
    const [off, recipe, stock] = await Promise.all([
      supabase.from("menu_unavailable").select("item_id"),
      supabase.from("recipe").select("item_id, ingredient_id, qty_per_unit"),
      supabase
        .from("ingredient_stock")
        .select("ingredient_id, remaining")
        .eq("date", todayVN()),
    ]);

    const out = new Set<string>((off.data ?? []).map((r) => r.item_id as string));
    const stockMap = new Map<string, number>(
      (stock.data ?? []).map((r) => [r.ingredient_id as string, Number(r.remaining)]),
    );
    for (const r of (recipe.data ?? []) as RecipeRow[]) {
      const rem = stockMap.get(r.ingredient_id);
      if (rem !== undefined && rem < Number(r.qty_per_unit)) out.add(r.item_id);
    }
    return [...out];
  } catch {
    return [];
  }
}
