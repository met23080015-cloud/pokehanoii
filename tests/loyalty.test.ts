import { describe, it, expect } from "vitest";
import {
  maxRedeemablePoints,
  discountForPoints,
  VND_PER_POINT,
  MAX_REDEEM_RATIO,
} from "@/lib/loyalty";

describe("lib/loyalty — discountForPoints", () => {
  it("1 điểm = 1.000đ", () => {
    expect(discountForPoints(1)).toBe(VND_PER_POINT);
    expect(discountForPoints(25)).toBe(25_000);
  });

  it("kẹp âm/thập phân về số nguyên không âm", () => {
    expect(discountForPoints(-5)).toBe(0);
    expect(discountForPoints(3.9)).toBe(3_000);
  });
});

describe("lib/loyalty — maxRedeemablePoints", () => {
  it("kẹp theo trần 50% giá trị đơn khi dư điểm", () => {
    // đơn 200k → trần 100k → tối đa 100 điểm, dù có 999 điểm
    expect(maxRedeemablePoints(999, 200_000)).toBe(100);
    expect(MAX_REDEEM_RATIO).toBe(0.5);
  });

  it("kẹp theo số điểm đang có khi điểm ít hơn trần", () => {
    // đơn 200k → trần 100 điểm, nhưng chỉ có 30 → tối đa 30
    expect(maxRedeemablePoints(30, 200_000)).toBe(30);
  });

  it("làm tròn xuống khi 50% đơn không chia hết 1.000đ", () => {
    // đơn 155k → 50% = 77.5k → floor(77500/1000) = 77 điểm
    expect(maxRedeemablePoints(999, 155_000)).toBe(77);
  });

  it("trả 0 khi không có điểm, đơn rỗng, hoặc đầu vào âm", () => {
    expect(maxRedeemablePoints(0, 200_000)).toBe(0);
    expect(maxRedeemablePoints(100, 0)).toBe(0);
    expect(maxRedeemablePoints(-10, 200_000)).toBe(0);
    expect(maxRedeemablePoints(100, -5_000)).toBe(0);
  });

  it("đơn quá nhỏ (<2.000đ) → trần 0 điểm", () => {
    // đơn 1.000đ → 50% = 500đ < 1.000đ → 0 điểm
    expect(maxRedeemablePoints(100, 1_000)).toBe(0);
  });
});
