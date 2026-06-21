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
