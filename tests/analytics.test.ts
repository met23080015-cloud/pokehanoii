import { describe, it, expect } from "vitest";
import { computeAnalytics } from "@/lib/analytics";
import type { Order } from "@/lib/supabase/types";

// Tạo đơn giả lập tối giản cho test tổng hợp.
function order(p: Partial<Order>): Order {
  return {
    id: Math.random().toString(36).slice(2),
    order_token: "tok",
    table_no: 1,
    items: [],
    total_kcal: 0,
    total_protein: 0,
    total_fat: 0,
    total_fiber: 0,
    total_price: 0,
    pay_method: "counter",
    status: "done",
    paid: false,
    created_at: "2026-06-20T10:00:00.000Z",
    ...p,
  };
}

describe("lib/analytics — computeAnalytics", () => {
  it("trả số 0 an toàn khi không có đơn", () => {
    const a = computeAnalytics([]);
    expect(a.summary.orderCount).toBe(0);
    expect(a.summary.revenue).toBe(0);
    expect(a.summary.avgOrderValue).toBe(0);
    expect(a.summary.paidRate).toBe(0);
    expect(a.topItems).toEqual([]);
  });

  it("doanh thu chỉ tính đơn đã thanh toán; grossRevenue tính tất cả", () => {
    const a = computeAnalytics([
      order({ total_price: 200000, paid: true }),
      order({ total_price: 100000, paid: false }),
    ]);
    expect(a.summary.revenue).toBe(200000);
    expect(a.summary.grossRevenue).toBe(300000);
    expect(a.summary.paidCount).toBe(1);
    expect(a.summary.paidRate).toBe(50);
    expect(a.summary.avgOrderValue).toBe(200000);
  });

  it("gộp số lượng món qua nhiều đơn và xếp hạng best-seller", () => {
    const a = computeAnalytics([
      order({ items: [{ id: "poke-salmon", vi: "Cá hồi", qty: 2, kcal: 210 }] }),
      order({
        items: [
          { id: "poke-salmon", vi: "Cá hồi", qty: 1, kcal: 105 },
          { id: "top-wakame", vi: "Rong biển", qty: 4, kcal: 40 },
        ],
      }),
    ]);
    expect(a.topItems[0]).toMatchObject({ id: "top-wakame", qty: 4 });
    expect(a.topItems[1]).toMatchObject({ id: "poke-salmon", qty: 3 });
  });

  it("tính calo trung bình mỗi đơn", () => {
    const a = computeAnalytics([
      order({ total_kcal: 600 }),
      order({ total_kcal: 800 }),
    ]);
    expect(a.summary.avgKcal).toBe(700);
  });

  it("phân loại pay_method và giờ cao điểm", () => {
    const a = computeAnalytics([
      order({ pay_method: "counter", created_at: "2026-06-20T11:30:00.000Z" }),
      order({ pay_method: "vietqr", created_at: "2026-06-20T11:45:00.000Z" }),
      order({ pay_method: "vietqr", created_at: "2026-06-20T19:00:00.000Z" }),
    ]);
    expect(a.payMix.counter).toBe(1);
    expect(a.payMix.vietqr).toBe(2);
    expect(a.peakHours.reduce((s, n) => s + n, 0)).toBe(3);
  });

  it("gộp doanh thu theo ngày, sắp xếp tăng dần", () => {
    const a = computeAnalytics([
      order({ total_price: 100000, created_at: "2026-06-21T10:00:00.000Z" }),
      order({ total_price: 200000, created_at: "2026-06-20T10:00:00.000Z" }),
      order({ total_price: 50000, created_at: "2026-06-20T15:00:00.000Z" }),
    ]);
    expect(a.revenueByDay.map((d) => d.day)).toEqual(["2026-06-20", "2026-06-21"]);
    expect(a.revenueByDay[0]).toMatchObject({ revenue: 250000, count: 2 });
  });
});
