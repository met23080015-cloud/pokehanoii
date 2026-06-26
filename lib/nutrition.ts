import {
  getItem,
  getItemGroup,
  pricing,
  thresholds,
  type Thresholds,
} from "@/lib/menu";

/** Selection = item id -> quantity (số muỗng/phần). qty 0 hoặc thiếu = không chọn. */
export type Selection = Record<string, number>;

export interface Totals {
  kcal: number;
  protein: number;
  fat: number;
  fiber: number;
  price: number;
  proteinScoops: number;
  premiumCount: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Cấu hình giá ghi đè (từ menu_config). Thiếu field nào thì dùng mặc định menu.json. */
export interface PriceConfig {
  basePrice?: number;
  extraPokeFee?: number;
  extraBaseFee?: number;
  extraToppingFee?: number;
}

/** Nhóm tính phụ phí "mỗi phần thêm" (sốt/đồ trộn/topping/giòn) — ngoài đạm/nền/đồ uống. */
const ADDON_GROUPS = new Set(["mixins", "sauces", "toppings", "crisps"]);

/** Cỡ bát: vừa (Regular) hoặc thêm phần đạm (Extra Poke). */
export type BowlSize = "regular" | "extra";

/**
 * Tính tổng dinh dưỡng + giá từ selection.
 * Mô hình giá "thêm/bớt mọi món": basePrice đã gồm 1 lớp nền + 1 muỗng đạm; MỖI PHẦN THÊM đều tính tiền:
 *   + extraPokeFee   × (muỗng đạm − 1)         (muỗng đạm đầu đã gồm trong base)
 *   + extraBaseFee   × (lớp nền − 1)           (lớp nền đầu đã gồm trong base)
 *   + (premiumFee | extraToppingFee) × qty     cho mỗi phần đồ trộn/sốt/topping/giòn
 *   + price × qty                              cho đồ uống (giá riêng)
 *   + extraPokeFee   nếu cỡ "extra" (thêm 1 muỗng đạm + macro loại đạm đang chọn)
 * Đây là NGUỒN CHÂN LÝ — server tính lại, AI không tự tính.
 * `config` ghi đè giá từ DB; `size` mặc định "regular".
 */
export function computeTotals(
  selection: Selection,
  config?: PriceConfig,
  size: BowlSize = "regular",
): Totals {
  let kcal = 0,
    protein = 0,
    fat = 0,
    fiber = 0,
    addonFees = 0,
    proteinScoops = 0,
    baseUnits = 0,
    premiumCount = 0,
    drinksTotal = 0;

  const extraToppingFee = config?.extraToppingFee ?? pricing.extraToppingFee;

  for (const [id, qtyRaw] of Object.entries(selection)) {
    const qty = qtyRaw || 0;
    if (qty <= 0) continue;
    const item = getItem(id);
    if (!item) continue;

    kcal += (item.kcal ?? 0) * qty;
    protein += (item.protein ?? 0) * qty;
    fat += (item.fat ?? 0) * qty;
    fiber += (item.fiber ?? 0) * qty;

    const group = getItemGroup(id);
    if (group === "proteins") proteinScoops += qty;
    else if (group === "bases") baseUnits += qty;
    // Đồ uống tính theo GIÁ RIÊNG (không dùng giá bowl), macro vẫn vào tổng.
    else if (group === "drinks") drinksTotal += (item.price ?? 0) * qty;
    else if (group && ADDON_GROUPS.has(group)) {
      // Topping premium tính theo premiumFee; còn lại theo phụ phí phần thêm chung.
      addonFees += (item.premiumFee ?? extraToppingFee) * qty;
      if (item.premiumFee) premiumCount += qty;
    }
  }

  // Extra Poke: thêm 1 phần đạm — macro của loại đạm đang chọn (nếu có) vào dinh dưỡng.
  let extraProteinScoops = 0;
  if (size === "extra") {
    extraProteinScoops = 1;
    const firstProtein = Object.entries(selection).find(
      ([id, q]) => (q || 0) > 0 && getItemGroup(id) === "proteins",
    );
    const p = firstProtein ? getItem(firstProtein[0]) : null;
    if (p) {
      kcal += p.kcal ?? 0;
      protein += p.protein ?? 0;
      fat += p.fat ?? 0;
      fiber += p.fiber ?? 0;
    }
  }

  const basePrice = config?.basePrice ?? pricing.basePrice;
  const extraFee = config?.extraPokeFee ?? pricing.extraPokeFee;
  const extraBaseFee = config?.extraBaseFee ?? pricing.extraBaseFee;
  const extraPoke =
    Math.max(0, proteinScoops - 1) * extraFee + extraProteinScoops * extraFee;
  const extraBase = Math.max(0, baseUnits - 1) * extraBaseFee;
  const price = basePrice + extraPoke + extraBase + addonFees + drinksTotal;

  return {
    kcal: Math.round(kcal),
    protein: round1(protein),
    fat: round1(fat),
    fiber: round1(fiber),
    price,
    proteinScoops: proteinScoops + extraProteinScoops,
    premiumCount,
  };
}

export interface BalanceResult {
  score: number; // 0-100
  gaps: string[];
}

/**
 * Đánh giá cân bằng dinh dưỡng (deterministic) so với ngưỡng.
 * Dùng làm fallback + dữ liệu nền cho AI review (AI chỉ diễn giải).
 */
export function evaluateBalance(
  totals: Totals,
  t: Thresholds = thresholds,
): BalanceResult {
  const gaps: string[] = [];
  let score = 100;

  if (totals.protein < t.proteinMin) {
    gaps.push(`Thiếu đạm (${totals.protein}g < ${t.proteinMin}g khuyến nghị)`);
    score -= 25;
  } else if (totals.protein > t.proteinMax) {
    gaps.push(`Dư đạm (${totals.protein}g > ${t.proteinMax}g)`);
    score -= 10;
  }
  if (totals.fiber < t.fiberMin) {
    gaps.push(`Thiếu chất xơ (${totals.fiber}g < ${t.fiberMin}g) — nên thêm rau xanh`);
    score -= 20;
  }
  if (totals.fat > t.fatMax) {
    gaps.push(`Nhiều chất béo (${totals.fat}g > ${t.fatMax}g)`);
    score -= 15;
  }

  return { score: Math.max(0, score), gaps };
}

export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}
