import { groups, getItem, type MenuItem, type DietFilter, isHiddenByDiet } from "@/lib/menu";
import {
  computeTotals,
  type BowlSize,
  type Selection,
  type Totals,
} from "@/lib/nutrition";

/** Ràng buộc khách đưa ra. Field nào không có = không áp ràng buộc đó. */
export interface SuggestParams {
  budget?: number; // trần giá (VND)
  kcalTarget?: number; // sàn calo cần đạt
  proteinMin?: number; // sàn đạm (g)
  diet?: DietFilter[];
  excludeIds?: string[]; // món hết hàng / 86 hôm nay
  maxScoops?: number; // số muỗng đạm tối đa khi duyệt (mặc định 3)
}

export interface SuggestedBowl {
  selection: Selection;
  size: BowlSize;
  items: { vi: string; en: string; qty: number }[];
  totals: Totals;
}

export interface SuggestResult {
  feasible: boolean;
  /** Đạt CẢ ngân sách lẫn sàn calo/đạm. */
  bowl: SuggestedBowl | null;
  /**
   * Bowl RẺ NHẤT đạt sàn calo/đạm khi BỎ QUA ngân sách — chỉ có khi infeasible vì
   * thiếu tiền. Dùng để báo đúng "cần thêm (giá - budget)đ mới đạt dinh dưỡng".
   */
  goalMin: SuggestedBowl | null;
  /** Gần nhất tổng thể — fallback khi ngay cả bỏ qua tiền cũng không đạt sàn. */
  nearest: SuggestedBowl | null;
  params: { budget?: number; kcalTarget?: number; proteinMin?: number };
}

const MAX_FILLERS = 8; // chặn nhồi quá nhiều topping

function describe(sel: Selection): { vi: string; en: string; qty: number }[] {
  return Object.entries(sel)
    .filter(([, q]) => (q || 0) > 0)
    .map(([id, q]) => {
      const it = getItem(id);
      return { vi: it?.vi ?? id, en: it?.en ?? id, qty: q };
    });
}

/**
 * Nhồi các topping/sauce/mixin/crisp thường (không premiumFee, không phải đồ uống)
 * để kéo kcal/đạm chạm sàn. LƯU Ý: mỗi phần thêm nay đều tính phí (extraToppingFee),
 * nên nếu có ngân sách thì DỪNG trước khi vượt trần. Mỗi vòng chọn món bù được nhiều
 * nhất cho chỉ tiêu đang thiếu; dừng khi đủ sàn, hết món, hoặc chạm trần MAX_FILLERS.
 */
function fillToward(
  sel: Selection,
  size: BowlSize,
  fillers: MenuItem[],
  p: SuggestParams,
): void {
  const used = new Set<string>();
  while (used.size < MAX_FILLERS) {
    const t = computeTotals(sel, undefined, size);
    const kcalDef = p.kcalTarget ? Math.max(0, p.kcalTarget - t.kcal) : 0;
    const protDef = p.proteinMin ? Math.max(0, p.proteinMin - t.protein) : 0;
    if (kcalDef <= 0 && protDef <= 0) break;

    let pick: MenuItem | null = null;
    let bestGain = 0;
    for (const f of fillers) {
      if (used.has(f.id) || f.id in sel) continue; // không đụng món đã có sẵn trong sel
      // đạm khan hiếm → ưu tiên cao gấp đôi khi đang thiếu đạm
      const gain =
        (protDef > 0 ? (f.protein ?? 0) * 2 : 0) + (kcalDef > 0 ? (f.kcal ?? 0) : 0);
      if (gain > bestGain) {
        bestGain = gain;
        pick = f;
      }
    }
    if (!pick) break; // không món nào bù được nữa
    // Filler nay tính tiền (đồng giá nhau) → nếu thêm là vượt ngân sách thì ngừng.
    if (p.budget != null) {
      const next = computeTotals({ ...sel, [pick.id]: 1 }, undefined, size);
      if (next.price > p.budget) break;
    }
    sel[pick.id] = 1;
    used.add(pick.id);
  }
}

function meetsFloors(t: Totals, p: SuggestParams): boolean {
  return (
    (p.kcalTarget == null || t.kcal >= p.kcalTarget) &&
    (p.proteinMin == null || t.protein >= p.proteinMin)
  );
}

function withinBudget(t: Totals, p: SuggestParams): boolean {
  return p.budget == null || t.price <= p.budget;
}

/** Càng nhỏ càng gần khả thi — gộp phần vượt ngân sách + thiếu calo + thiếu đạm. */
function shortfallScore(t: Totals, p: SuggestParams): number {
  let s = 0;
  if (p.budget && t.price > p.budget) s += (t.price - p.budget) / 1000;
  if (p.kcalTarget && t.kcal < p.kcalTarget) s += (p.kcalTarget - t.kcal) / 10;
  if (p.proteinMin && t.protein < p.proteinMin) s += p.proteinMin - t.protein;
  return s;
}

/** Rẻ nhất; hoà giá → gần kcalTarget nhất; rồi đạm cao hơn. */
function isBetter(a: SuggestedBowl, b: SuggestedBowl, p: SuggestParams): boolean {
  if (a.totals.price !== b.totals.price) return a.totals.price < b.totals.price;
  if (p.kcalTarget) {
    const da = Math.abs(a.totals.kcal - p.kcalTarget);
    const db = Math.abs(b.totals.kcal - p.kcalTarget);
    if (da !== db) return da < db;
  }
  return a.totals.protein > b.totals.protein;
}

/**
 * Tìm tổ hợp poke bowl RẺ NHẤT đáp ứng ràng buộc ngân sách/calo/đạm.
 * Duyệt khung "đắt tiền" (base × loại đạm × số muỗng × cỡ), nhồi topping (có tính phí,
 * tôn trọng ngân sách) để chạm sàn calo/đạm, rồi tính lại bằng computeTotals (NGUỒN CHÂN LÝ → giá/macro
 * khớp checkout). Không khả thi → trả phương án gần nhất kèm dữ liệu để AI giải thích.
 * Đồ uống & topping premium KHÔNG đưa vào auto-fill (giữ kết quả rẻ & gọn).
 */
export function suggestBowl(p: SuggestParams): SuggestResult {
  const maxScoops = p.maxScoops ?? 3;
  const excluded = new Set(p.excludeIds ?? []);
  const diet = p.diet ?? [];
  const ok = (it: MenuItem) => !excluded.has(it.id) && !isHiddenByDiet(it, diet);

  const bases = groups.bases.filter(ok);
  const proteins = groups.proteins.filter(ok);
  const fillers = [
    ...groups.toppings,
    ...groups.mixins,
    ...groups.sauces,
    ...groups.crisps,
  ].filter((it) => ok(it) && !it.premiumFee);

  const params = { budget: p.budget, kcalTarget: p.kcalTarget, proteinMin: p.proteinMin };
  let best: SuggestedBowl | null = null; // đạt budget + floors
  let goalMin: SuggestedBowl | null = null; // rẻ nhất đạt floors (bỏ qua budget)
  let nearest: SuggestedBowl | null = null; // gần nhất tổng thể
  let nearestScore = Infinity;

  for (const base of bases) {
    for (const prot of proteins) {
      for (let scoops = 1; scoops <= maxScoops; scoops++) {
        for (const size of ["regular", "extra"] as BowlSize[]) {
          const sel: Selection = { [base.id]: 1, [prot.id]: scoops };
          fillToward(sel, size, fillers, p);
          const totals = computeTotals(sel, undefined, size);
          const cand: SuggestedBowl = { selection: sel, size, items: describe(sel), totals };

          const floorsOk = meetsFloors(totals, p);
          if (floorsOk && (!goalMin || isBetter(cand, goalMin, p))) goalMin = cand;
          if (floorsOk && withinBudget(totals, p) && (!best || isBetter(cand, best, p)))
            best = cand;

          const s = shortfallScore(totals, p);
          if (s < nearestScore) {
            nearestScore = s;
            nearest = cand;
          }
        }
      }
    }
  }

  if (best) return { feasible: true, bowl: best, goalMin: null, nearest: null, params };
  // Infeasible: nếu đạt được dinh dưỡng khi bỏ qua tiền → cần thêm tiền (goalMin);
  // nếu không thì ngay cả không giới hạn tiền cũng bất khả → nearest.
  return { feasible: false, bowl: null, goalMin, nearest: goalMin ? null : nearest, params };
}
