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
  table_no: number | null;
  items: OrderLineItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_fiber: number;
  total_price: number;
  pay_method: PayMethod;
  status: OrderStatus;
  created_at: string;
}

/** Payload client gửi lên /api/orders (server tính lại totals từ selection). */
export interface CreateOrderPayload {
  table_no: number | null;
  selection: Record<string, number>;
  pay_method: PayMethod;
}
