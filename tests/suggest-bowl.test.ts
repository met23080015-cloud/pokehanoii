import { describe, it, expect } from "vitest";
import { suggestBowl } from "@/lib/ai/suggest-bowl";
import { computeTotals } from "@/lib/nutrition";

describe("suggestBowl — tối ưu có ràng buộc", () => {
  it("đạt sàn calo + đạm trong ngân sách → feasible, đúng giới hạn", () => {
    // Topping nay tính phí → cần ngân sách rộng hơn để vừa chạm sàn vừa trong trần.
    const r = suggestBowl({ budget: 350000, kcalTarget: 600, proteinMin: 40 });
    expect(r.feasible).toBe(true);
    expect(r.bowl).not.toBeNull();
    const t = r.bowl!.totals;
    expect(t.price).toBeLessThanOrEqual(350000);
    expect(t.kcal).toBeGreaterThanOrEqual(600);
    expect(t.protein).toBeGreaterThanOrEqual(40);
  });

  it("giá/macro của bowl gợi ý KHỚP computeTotals (nguồn chân lý)", () => {
    const r = suggestBowl({ budget: 300000, kcalTarget: 500, proteinMin: 30 });
    const b = r.bowl!;
    const recomputed = computeTotals(b.selection, undefined, b.size);
    expect(recomputed.price).toBe(b.totals.price);
    expect(recomputed.kcal).toBe(b.totals.kcal);
    expect(recomputed.protein).toBe(b.totals.protein);
  });

  it("trả về phương án RẺ NHẤT trong các lựa chọn đạt ràng buộc", () => {
    // chỉ cần đạm thấp → không cần thêm muỗng đắt tiền → phải ra giá nền 198k
    const r = suggestBowl({ budget: 300000, proteinMin: 10 });
    expect(r.feasible).toBe(true);
    expect(r.bowl!.totals.price).toBe(198000);
  });

  it("ngân sách thấp hơn giá 1 bát → infeasible, goalMin cho biết cần thêm tiền", () => {
    const r = suggestBowl({ budget: 100000, kcalTarget: 600 });
    expect(r.feasible).toBe(false);
    expect(r.bowl).toBeNull();
    // dinh dưỡng đạt được khi bỏ qua tiền → goalMin set, giá > ngân sách
    expect(r.goalMin).not.toBeNull();
    expect(r.goalMin!.totals.kcal).toBeGreaterThanOrEqual(600);
    expect(r.goalMin!.totals.price).toBeGreaterThan(100000);
  });

  it("đạm cao bất khả thi trong ngân sách → infeasible nhưng goalMin đạt đạm", () => {
    // 40g đạm cần >=2-3 muỗng (mỗi muỗng +48k) → 150k không đủ, nhưng đạt được nếu thêm tiền
    const r = suggestBowl({ budget: 150000, proteinMin: 40 });
    expect(r.feasible).toBe(false);
    expect(r.goalMin).not.toBeNull();
    expect(r.goalMin!.totals.protein).toBeGreaterThanOrEqual(40);
  });

  it("đạm vượt khả năng menu (bỏ qua tiền vẫn không đạt) → goalMin null, có nearest", () => {
    const r = suggestBowl({ proteinMin: 500 });
    expect(r.feasible).toBe(false);
    expect(r.goalMin).toBeNull();
    expect(r.nearest).not.toBeNull();
  });

  it("loại trừ món hết hàng → không gợi ý cá hồi khi đã exclude", () => {
    const r = suggestBowl({
      budget: 300000,
      proteinMin: 30,
      excludeIds: ["poke-salmon", "poke-spicy-salmon"],
    });
    expect(r.feasible).toBe(true);
    expect(Object.keys(r.bowl!.selection)).not.toContain("poke-salmon");
    expect(Object.keys(r.bowl!.selection)).not.toContain("poke-spicy-salmon");
  });

  it("bộ lọc chay → không có hải sản/nguồn động vật trong gợi ý", () => {
    const r = suggestBowl({ budget: 300000, kcalTarget: 400, diet: ["vegan"] });
    expect(r.feasible).toBe(true);
    // poke-vegan là đạm chay duy nhất không tag → phải được chọn
    expect(Object.keys(r.bowl!.selection)).toContain("poke-vegan");
  });

  it("không ràng buộc → trả bát rẻ nhất (giá nền)", () => {
    const r = suggestBowl({});
    expect(r.feasible).toBe(true);
    expect(r.bowl!.totals.price).toBe(198000);
  });
});
