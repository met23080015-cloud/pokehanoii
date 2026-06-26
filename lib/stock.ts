import type { Selection } from "@/lib/nutrition";

/** 1 dòng công thức BOM: 1 đơn vị MÓN tiêu thụ bao nhiêu nguyên liệu. */
export type RecipeRow = { item_id: string; ingredient_id: string; qty_per_unit: number };

type Part = { ing: string; per: number };

/** Gom công thức theo món: item_id -> các nguyên liệu nó dùng. */
export function indexRecipes(recipes: RecipeRow[]): Map<string, Part[]> {
  const idx = new Map<string, Part[]>();
  for (const r of recipes) {
    const arr = idx.get(r.item_id) ?? [];
    arr.push({ ing: r.ingredient_id, per: Number(r.qty_per_unit) });
    idx.set(r.item_id, arr);
  }
  return idx;
}

/**
 * Số phần CÒN THÊM ĐƯỢC cho mỗi món, tính theo tồn kho thực tế và phần đã có trong giỏ
 * (chia sẻ nguyên liệu: vd cá hồi & cá hồi cay chung 1 kho). Trả Record<itemId, số phần thêm>.
 *
 * - `remaining`: ingredient_id -> tồn còn lại hôm nay. Nguyên liệu KHÔNG có trong map = vô hạn
 *   (chưa có dòng tồn → chưa giới hạn), nên món chỉ-dùng-nguyên-liệu-vô-hạn sẽ KHÔNG xuất hiện
 *   trong kết quả (người gọi coi như Infinity → không chặn nút +).
 * - Giá trị 0 = không thêm được nữa (nút + cần bị vô hiệu hoá).
 */
export function computeHeadroom(
  selection: Selection,
  recipes: RecipeRow[],
  remaining: Map<string, number>,
): Record<string, number> {
  const idx = indexRecipes(recipes);

  // Tồn khả dụng = tồn còn lại − phần đã chọn trong giỏ (chỉ trừ nguyên liệu có giới hạn).
  const available = new Map(remaining);
  for (const [id, qtyRaw] of Object.entries(selection)) {
    const qty = qtyRaw || 0;
    if (qty <= 0) continue;
    for (const p of idx.get(id) ?? []) {
      if (available.has(p.ing)) available.set(p.ing, available.get(p.ing)! - qty * p.per);
    }
  }

  const out: Record<string, number> = {};
  for (const [id, parts] of idx) {
    let cap = Infinity;
    for (const p of parts) {
      if (available.has(p.ing)) cap = Math.min(cap, Math.floor(available.get(p.ing)! / p.per));
    }
    if (cap !== Infinity) out[id] = Math.max(0, cap);
  }
  return out;
}
