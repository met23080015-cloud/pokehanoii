import type { Order } from "@/lib/supabase/types";

/**
 * Tổng hợp số liệu kinh doanh từ danh sách đơn (THUẦN, không I/O — dễ test).
 * Đây là NGUỒN CHÂN LÝ cho cả dashboard analytics lẫn AI insight (AI chỉ diễn giải).
 */

export interface AnalyticsSummary {
  orderCount: number;
  paidCount: number;
  revenue: number; // doanh thu đơn đã thanh toán
  grossRevenue: number; // tổng giá trị mọi đơn (gồm chưa trả)
  avgOrderValue: number; // AOV trên đơn đã trả
  avgKcal: number; // calo trung bình / đơn
  paidRate: number; // % đơn đã thanh toán
}

export interface ItemStat {
  id: string;
  vi: string;
  qty: number;
}

export interface DayStat {
  day: string; // YYYY-MM-DD
  revenue: number;
  count: number;
}

export interface Analytics {
  summary: AnalyticsSummary;
  topItems: ItemStat[];
  slowItems: ItemStat[];
  revenueByDay: DayStat[];
  payMix: { counter: number; vietqr: number };
  peakHours: number[]; // 24 phần tử: số đơn theo giờ 0..23
}

const round = (n: number) => Math.round(n);

export function computeAnalytics(orders: Order[]): Analytics {
  const paid = orders.filter((o) => o.paid);
  const revenue = paid.reduce((s, o) => s + (o.total_price || 0), 0);
  const grossRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const kcalSum = orders.reduce((s, o) => s + (o.total_kcal || 0), 0);

  // Gộp số lượng từng món qua mọi đơn
  const itemMap = new Map<string, ItemStat>();
  for (const o of orders) {
    for (const it of o.items || []) {
      const cur = itemMap.get(it.id) || { id: it.id, vi: it.vi, qty: 0 };
      cur.qty += it.qty || 0;
      itemMap.set(it.id, cur);
    }
  }
  const itemsSorted = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);

  // Doanh thu theo ngày
  const dayMap = new Map<string, DayStat>();
  for (const o of orders) {
    const day = (o.created_at || "").slice(0, 10);
    if (!day) continue;
    const cur = dayMap.get(day) || { day, revenue: 0, count: 0 };
    cur.revenue += o.total_price || 0;
    cur.count += 1;
    dayMap.set(day, cur);
  }
  const revenueByDay = Array.from(dayMap.values()).sort((a, b) =>
    a.day.localeCompare(b.day),
  );

  // Mix phương thức thanh toán
  const payMix = { counter: 0, vietqr: 0 };
  for (const o of orders) {
    if (o.pay_method === "vietqr") payMix.vietqr += 1;
    else payMix.counter += 1;
  }

  // Giờ cao điểm (theo giờ địa phương của created_at)
  const peakHours = new Array(24).fill(0);
  for (const o of orders) {
    if (!o.created_at) continue;
    const h = new Date(o.created_at).getHours();
    if (h >= 0 && h < 24) peakHours[h] += 1;
  }

  return {
    summary: {
      orderCount: orders.length,
      paidCount: paid.length,
      revenue,
      grossRevenue,
      avgOrderValue: paid.length ? round(revenue / paid.length) : 0,
      avgKcal: orders.length ? round(kcalSum / orders.length) : 0,
      paidRate: orders.length ? round((paid.length / orders.length) * 100) : 0,
    },
    topItems: itemsSorted.slice(0, 8),
    slowItems: itemsSorted.slice(-5).reverse(),
    revenueByDay,
    payMix,
    peakHours,
  };
}
