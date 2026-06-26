import { describe, it, expect } from "vitest";
import { computeHeadroom, indexRecipes, type RecipeRow } from "@/lib/stock";

// Công thức mẫu: cá hồi & cá hồi cay chung kho 'ing-salmon'; base mix dùng 0.5 cơm + 0.5 salad.
const recipes: RecipeRow[] = [
  { item_id: "poke-salmon", ingredient_id: "ing-salmon", qty_per_unit: 1 },
  { item_id: "poke-spicy-salmon", ingredient_id: "ing-salmon", qty_per_unit: 1 },
  { item_id: "base-mix", ingredient_id: "ing-rice", qty_per_unit: 0.5 },
  { item_id: "base-mix", ingredient_id: "ing-salad", qty_per_unit: 0.5 },
  { item_id: "top-wakame", ingredient_id: "ing-wakame", qty_per_unit: 1 },
];

describe("indexRecipes", () => {
  it("gom nhiều nguyên liệu của 1 món", () => {
    const idx = indexRecipes(recipes);
    expect(idx.get("base-mix")).toHaveLength(2);
    expect(idx.get("poke-salmon")).toEqual([{ ing: "ing-salmon", per: 1 }]);
  });
});

describe("computeHeadroom", () => {
  it("nguyên liệu KHÔNG có dòng tồn = vô hạn → món vắng mặt trong kết quả (không giới hạn)", () => {
    const out = computeHeadroom({}, recipes, new Map());
    expect(out["poke-salmon"]).toBeUndefined();
    expect(out["top-wakame"]).toBeUndefined();
  });

  it("trừ phần đã có trong giỏ", () => {
    const remaining = new Map([["ing-salmon", 5]]);
    const out = computeHeadroom({ "poke-salmon": 2 }, recipes, remaining);
    expect(out["poke-salmon"]).toBe(3); // 5 − 2 = 3 phần còn thêm được
  });

  it("kho chia sẻ → cá hồi cay bị giới hạn bởi phần cá hồi đã chọn", () => {
    const remaining = new Map([["ing-salmon", 4]]);
    const out = computeHeadroom({ "poke-salmon": 3 }, recipes, remaining);
    expect(out["poke-salmon"]).toBe(1); // 4 − 3
    expect(out["poke-spicy-salmon"]).toBe(1); // chung kho ing-salmon
  });

  it("hết kho → headroom 0 (nút + cần bị chặn)", () => {
    const remaining = new Map([["ing-salmon", 2]]);
    const out = computeHeadroom({ "poke-salmon": 2 }, recipes, remaining);
    expect(out["poke-salmon"]).toBe(0);
    expect(out["poke-spicy-salmon"]).toBe(0);
  });

  it("vượt kho (tồn tụt sau khi đã chọn) → kẹp 0, không âm", () => {
    const remaining = new Map([["ing-salmon", 1]]);
    const out = computeHeadroom({ "poke-salmon": 5 }, recipes, remaining);
    expect(out["poke-salmon"]).toBe(0);
  });

  it("qty_per_unit phân số (base mix) → làm tròn xuống theo nguyên liệu khan nhất", () => {
    const remaining = new Map([
      ["ing-rice", 3], // 3 / 0.5 = 6
      ["ing-salad", 1], // 1 / 0.5 = 2 → nút thắt
    ]);
    const out = computeHeadroom({}, recipes, remaining);
    expect(out["base-mix"]).toBe(2);
  });
});
