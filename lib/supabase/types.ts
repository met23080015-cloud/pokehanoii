export type OrderStatus = "pending" | "accepted" | "done";
export type PayMethod = "counter" | "vietqr";

/** Snapshot 1 dòng món trong đơn (lưu kèm để admin đọc không cần tra menu). */
export interface OrderLineItem {
  id: string;
  vi: string;
  qty: number;
  kcal: number;
}

export interface Order {
  id: string;
  order_token: string;
  table_no: number | null;
  items: OrderLineItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_fiber: number;
  total_price: number;
  pay_method: PayMethod;
  status: OrderStatus;
  paid?: boolean;
  user_id?: string | null;
  created_at: string;
}

export interface Customer {
  user_id: string;
  points: number;
  created_at: string;
}

/** Điểm thưởng: 1 điểm cho mỗi 10.000đ. */
export const POINTS_PER_VND = 10000;

/** Payload client gửi lên /api/orders (server tính lại totals từ selection). */
export interface CreateOrderPayload {
  table_no: number | null;
  selection: Record<string, number>;
  pay_method: PayMethod;
}
