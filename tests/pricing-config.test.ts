import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/nutrition";

// base + 2 muỗng đạm (muỗng đầu gồm trong giá, muỗng 2 tính phụ phí)
const sel = { "base-brown-rice": 1, "poke-salmon": 2 };

describe("computeTotals — ghi đè giá từ config", () => {
  it("không truyền config → dùng mặc định menu.json (giữ hành vi cũ)", () => {
    expect(computeTotals(sel).price).toBe(246000); // 198000 + 48000
  });

  it("config ghi đè basePrice + extraPokeFee", () => {
    const t = computeTotals(sel, { basePrice: 100000, extraPokeFee: 10000 });
    expect(t.price).toBe(110000); // 100000 + 1*10000
  });

  it("config thiếu field nào thì field đó dùng mặc định", () => {
    const t = computeTotals(sel, { basePrice: 200000 });
    expect(t.price).toBe(248000); // 200000 + 1*48000 (extra mặc định)
  });

  it("config không ảnh hưởng dinh dưỡng (chỉ đổi giá)", () => {
    const a = computeTotals(sel);
    const b = computeTotals(sel, { basePrice: 1, extraPokeFee: 1 });
    expect(b.kcal).toBe(a.kcal);
    expect(b.protein).toBe(a.protein);
  });
});

describe("computeTotals — cỡ bát Extra Poke", () => {
  const regular = { "base-brown-rice": 1, "poke-salmon": 1 };

  it("Regular: 1 phần đạm = giá cơ bản 198.000đ", () => {
    expect(computeTotals(regular, undefined, "regular").price).toBe(198000);
  });

  it("Extra Poke: +48.000đ so với Regular (= 246.000đ)", () => {
    expect(computeTotals(regular, undefined, "extra").price).toBe(246000);
  });

  it("Extra Poke cộng macro của phần đạm đang chọn vào dinh dưỡng", () => {
    const r = computeTotals(regular, undefined, "regular");
    const e = computeTotals(regular, undefined, "extra");
    expect(e.kcal).toBeGreaterThan(r.kcal);
    expect(e.protein).toBeGreaterThan(r.protein);
    expect(e.proteinScoops).toBe(r.proteinScoops + 1);
  });

  it("mặc định không truyền size = Regular (giữ hành vi cũ)", () => {
    expect(computeTotals(regular).price).toBe(computeTotals(regular, undefined, "regular").price);
  });
});
