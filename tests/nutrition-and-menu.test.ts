import { describe, it, expect } from "vitest";
import { computeTotals, evaluateBalance, formatVND } from "@/lib/nutrition";
import { getItem, getItemGroup, allItems, pricing, thresholds } from "@/lib/menu";

// ---------------------------------------------------------------------------
// lib/menu.ts — pure data / lookup functions
// ---------------------------------------------------------------------------

describe("lib/menu — data loading & lookup", () => {
  it("allItems() returns a non-empty array", () => {
    const items = allItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it("allItems() contains unique ids", () => {
    const items = allItems();
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getItem() returns the correct item for a known id", () => {
    const salmon = getItem("poke-salmon");
    expect(salmon).toBeDefined();
    expect(salmon!.en).toBe("Salmon");
    expect(salmon!.kcal).toBe(105);
    expect(salmon!.protein).toBe(10);
    expect(salmon!.fat).toBe(6.5);
    expect(salmon!.fiber).toBe(0);
  });

  it("getItem() returns undefined for an unknown id", () => {
    expect(getItem("does-not-exist")).toBeUndefined();
  });

  it("getItemGroup() returns 'proteins' for poke-salmon", () => {
    expect(getItemGroup("poke-salmon")).toBe("proteins");
  });

  it("getItemGroup() returns 'toppings' for top-tobiko", () => {
    expect(getItemGroup("top-tobiko")).toBe("toppings");
  });

  it("getItemGroup() returns undefined for an unknown id", () => {
    expect(getItemGroup("phantom-item")).toBeUndefined();
  });

  it("pricing reflects data/menu.json values", () => {
    expect(pricing.basePrice).toBe(198000);
    expect(pricing.extraPokeFee).toBe(48000);
    expect(pricing.extraBaseFee).toBe(25000);
    expect(pricing.extraToppingFee).toBe(10000);
    expect(pricing.currency).toBe("VND");
  });

  it("thresholds reflect data/menu.json values", () => {
    expect(thresholds.proteinMin).toBe(25);
    expect(thresholds.proteinMax).toBe(45);
    expect(thresholds.fiberMin).toBe(8);
    expect(thresholds.fatMax).toBe(30);
  });

  it("top-tobiko has a premiumFee of 20000", () => {
    const tobiko = getItem("top-tobiko");
    expect(tobiko).toBeDefined();
    expect(tobiko!.premiumFee).toBe(20000);
  });
});

// ---------------------------------------------------------------------------
// lib/nutrition.ts — computeTotals
// ---------------------------------------------------------------------------

describe("computeTotals — pricing model", () => {
  // Case 1: empty selection
  it("empty selection → price = basePrice, all macros 0, proteinScoops 0", () => {
    const totals = computeTotals({});
    expect(totals.price).toBe(198000);
    expect(totals.kcal).toBe(0);
    expect(totals.protein).toBe(0);
    expect(totals.fat).toBe(0);
    expect(totals.fiber).toBe(0);
    expect(totals.proteinScoops).toBe(0);
    expect(totals.premiumCount).toBe(0);
  });

  // Case 2: one protein scoop → no extra poke fee
  it("one protein scoop → no extra poke fee (price = basePrice)", () => {
    const totals = computeTotals({ "poke-salmon": 1 });
    expect(totals.price).toBe(198000);
    expect(totals.proteinScoops).toBe(1);
  });

  // Case 3: three scoops of one protein → +2 × extraPokeFee
  it("three scoops of poke-salmon → price = basePrice + 2 * extraPokeFee", () => {
    const totals = computeTotals({ "poke-salmon": 3 });
    const expected = 198000 + 2 * 48000; // 294000
    expect(totals.price).toBe(expected);
    expect(totals.proteinScoops).toBe(3);
  });

  // Case 4: one premium topping → price includes +20000 premiumFee
  it("one top-tobiko → price = basePrice + 20000 premiumFee", () => {
    const totals = computeTotals({ "top-tobiko": 1 });
    const expected = 198000 + 20000; // 218000
    expect(totals.price).toBe(expected);
    expect(totals.premiumCount).toBe(1);
  });

  // Case 4b: qty=2 of premium topping → price includes +2*20000 premiumFee
  it("two top-tobiko → price = basePrice + 2 * 20000 premiumFee", () => {
    const totals = computeTotals({ "top-tobiko": 2 });
    const expected = 198000 + 2 * 20000; // 238000
    expect(totals.price).toBe(expected);
    expect(totals.premiumCount).toBe(2);
  });

  // Case 5: macro summation for a known multi-item bowl
  // bowl: base-sushi-rice x1, poke-salmon x2, sauce-shoyu x1
  // kcal:    260 + 105*2 + 9 = 479
  // protein: 5   + 10*2  + 1 = 26.0
  // fat:     0.5 + 6.5*2 + 0 = 13.5
  // fiber:   1   + 0     + 0 = 1.0
  // proteinScoops: 2  (only poke-salmon is in "proteins" group)
  // price: 198000 + (2-1)*48000 (extra scoop) + 1*10000 (sauce-shoyu add-on) = 256000
  it("multi-item bowl — correct macro summation and price", () => {
    const selection = {
      "base-sushi-rice": 1,
      "poke-salmon": 2,
      "sauce-shoyu": 1,
    };
    const totals = computeTotals(selection);
    expect(totals.kcal).toBe(479);
    expect(totals.protein).toBe(26);
    expect(totals.fat).toBe(13.5);
    expect(totals.fiber).toBe(1);
    expect(totals.proteinScoops).toBe(2);
    expect(totals.price).toBe(256000);
  });

  // Case 5b: extra base layer → +extraBaseFee (first base included)
  it("two bases → price = basePrice + extraBaseFee (first base included)", () => {
    const totals = computeTotals({ "base-sushi-rice": 1, "base-salad": 1 });
    expect(totals.price).toBe(198000 + 25000); // 223000
  });

  // Case 5c: normal (non-premium) toppings → each portion charged extraToppingFee
  it("two non-premium toppings → price = basePrice + 2 * extraToppingFee", () => {
    const totals = computeTotals({ "top-wakame": 2 });
    expect(totals.price).toBe(198000 + 2 * 10000); // 218000
    expect(totals.premiumCount).toBe(0);
  });

  // Case 5d: add-on fee respects config override
  it("config override changes add-on fee", () => {
    const totals = computeTotals({ "sauce-shoyu": 1 }, { extraToppingFee: 5000 });
    expect(totals.price).toBe(198000 + 5000);
  });

  // Edge: qty=0 items are ignored
  it("items with qty=0 are ignored (not counted)", () => {
    const totals = computeTotals({ "poke-salmon": 0, "poke-tuna": 1 });
    expect(totals.proteinScoops).toBe(1);
    expect(totals.price).toBe(198000); // no extra poke fee for 1 scoop
  });

  // Edge: unknown item id is silently skipped
  it("unknown item id in selection is silently skipped", () => {
    const totals = computeTotals({ "unknown-item": 5 });
    expect(totals.price).toBe(198000);
    expect(totals.kcal).toBe(0);
  });

  // Mixed: protein + premium topping
  it("two protein scoops + one premium topping → combined fees", () => {
    const totals = computeTotals({ "poke-tuna": 2, "top-tobiko": 1 });
    const expected = 198000 + 1 * 48000 + 20000; // 266000
    expect(totals.price).toBe(expected);
    expect(totals.proteinScoops).toBe(2);
    expect(totals.premiumCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// lib/nutrition.ts — evaluateBalance
// ---------------------------------------------------------------------------

describe("evaluateBalance", () => {
  // Case 6a: low-protein and low-fiber bowl → gaps mention "Thiếu"
  it("low protein and low fiber → score < 100, gaps include 'Thiếu đạm' and 'Thiếu chất xơ'", () => {
    // protein=5 < proteinMin(25), fiber=1 < fiberMin(8), fat=10 <= fatMax(30)
    const totals = {
      kcal: 300,
      protein: 5,
      fat: 10,
      fiber: 1,
      price: 198000,
      proteinScoops: 0,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBe(55); // 100 - 25 (protein) - 20 (fiber) = 55
    const gapsText = result.gaps.join(" ");
    expect(gapsText).toContain("Thiếu đạm");
    expect(gapsText).toContain("Thiếu chất xơ");
  });

  // Case 6b: balanced bowl → score = 100, no gaps
  it("balanced bowl → score = 100, no gaps", () => {
    // protein=30 (25-45 ok), fiber=10 (>=8 ok), fat=15 (<=30 ok)
    const totals = {
      kcal: 550,
      protein: 30,
      fat: 15,
      fiber: 10,
      price: 198000,
      proteinScoops: 2,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBe(100);
    expect(result.gaps).toHaveLength(0);
  });

  // Excess protein → deducts 10 points
  it("excess protein → score = 90, gap mentions 'Dư đạm'", () => {
    const totals = {
      kcal: 700,
      protein: 50,
      fat: 10,
      fiber: 10,
      price: 198000,
      proteinScoops: 4,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBe(90); // 100 - 10
    const gapsText = result.gaps.join(" ");
    expect(gapsText).toContain("Dư đạm");
  });

  // Excess fat → deducts 15 points
  it("excess fat → score = 85, gap mentions fat warning", () => {
    const totals = {
      kcal: 700,
      protein: 30,
      fat: 35,
      fiber: 10,
      price: 198000,
      proteinScoops: 2,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBe(85); // 100 - 15
    const gapsText = result.gaps.join(" ");
    expect(gapsText).toContain("Nhiều chất béo");
  });

  // All four issues at once → score floored at 0
  it("all four nutritional issues → score = max(0, 100-25-20-15) = 40", () => {
    const totals = {
      kcal: 200,
      protein: 5,   // < proteinMin: -25
      fat: 35,      // > fatMax: -15
      fiber: 1,     // < fiberMin: -20
      price: 198000,
      proteinScoops: 0,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBe(40); // 100 - 25 - 20 - 15
    expect(result.gaps).toHaveLength(3);
  });

  // Score never goes below 0
  it("score never goes below 0", () => {
    const totals = {
      kcal: 0,
      protein: 0,
      fat: 100,
      fiber: 0,
      price: 198000,
      proteinScoops: 0,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  // Custom thresholds override
  it("accepts custom thresholds parameter", () => {
    const customThresholds = {
      proteinMin: 50,
      proteinMax: 80,
      fiberMin: 20,
      fatMax: 5,
    };
    const totals = {
      kcal: 500,
      protein: 30,  // < proteinMin(50)
      fat: 10,      // > fatMax(5)
      fiber: 10,    // < fiberMin(20)
      price: 198000,
      proteinScoops: 2,
      premiumCount: 0,
    };
    const result = evaluateBalance(totals, customThresholds);
    expect(result.score).toBe(40); // 100 - 25 - 15 - 20
    expect(result.gaps).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// lib/nutrition.ts — formatVND
// ---------------------------------------------------------------------------

describe("formatVND", () => {
  // Case 7: vi-VN thousands separator and 'đ' suffix
  it("formats 198000 with vi-VN thousands separator and 'đ' suffix", () => {
    const result = formatVND(198000);
    // vi-VN uses period as thousands separator → "198.000đ"
    expect(result).toMatch(/198[.,\s]?000đ/);
    expect(result.endsWith("đ")).toBe(true);
  });

  it("formats 0 correctly", () => {
    expect(formatVND(0)).toBe("0đ");
  });

  it("formats 246000 correctly", () => {
    const result = formatVND(246000);
    expect(result.endsWith("đ")).toBe(true);
    // must contain the digits 246000 in some locale-formatted way
    expect(result.replace(/[^\d]/g, "")).toBe("246000");
  });

  it("formats large amounts with correct suffix", () => {
    const result = formatVND(1000000);
    expect(result.endsWith("đ")).toBe(true);
    expect(result.replace(/[^\d]/g, "")).toBe("1000000");
  });
});
