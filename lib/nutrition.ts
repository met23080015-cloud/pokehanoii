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
}

/** Cỡ bát: vừa (Regular) hoặc thêm phần đạm (Extra Poke). */
export type BowlSize = "regular" | "extra";

/**
 * Tính tổng dinh dưỡng + giá từ selection.
 * Giá: basePrice + extraPokeFee * (số muỗng đạm vượt quá 1) + (Extra Poke ? extraPokeFee) + premiumFee.
 * Cỡ "extra" = thêm 1 phần đạm: cộng phụ phí extraPokeFee + macro của loại đạm đang chọn.
 * Đây là NGUỒN CHÂN LÝ — server tính lại, AI không tự tính.
 * `config` ghi đè giá từ DB; `size` mặc định "regular" → giữ hành vi & test cũ.
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
    premiumFees = 0,
    proteinScoops = 0,
    premiumCount = 0;

  for (const [id, qtyRaw] of Object.entries(selection)) {
    const qty = qtyRaw || 0;
    if (qty <= 0) continue;
    const item = getItem(id);
    if (!item) continue;

    kcal += (item.kcal ?? 0) * qty;
    protein += (item.protein ?? 0) * qty;
    fat += (item.fat ?? 0) * qty;
    fiber += (item.fiber ?? 0) * qty;

    if (getItemGroup(id) === "proteins") proteinScoops += qty;
    if (item.premiumFee) {
      premiumFees += item.premiumFee * qty;
      premiumCount += qty;
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
  const extraPoke =
    Math.max(0, proteinScoops - 1) * extraFee + extraProteinScoops * extraFee;
  const price = basePrice + extraPoke + premiumFees;

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
