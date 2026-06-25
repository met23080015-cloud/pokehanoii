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
  pay_code?: string; // mã đối soát SePay (PKH+8hex), sinh ở DB
  points_redeemed?: number; // điểm đã dùng để giảm giá đơn này
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

/** Yêu cầu tại bàn gửi từ màn hình bắt đầu (giống thao tác nhanh của iPOS o2o). */
export type ServiceRequestType = "service" | "bill" | "feedback";
export interface ServiceRequest {
  id: string;
  table_no: number | null;
  type: ServiceRequestType;
  note: string | null;
  status: "open" | "done";
  created_at: string;
}

/** Tồn kho BOM. */
export interface Ingredient {
  id: string;
  name_vi: string;
  unit: string;
}
export interface Recipe {
  item_id: string;
  ingredient_id: string;
  qty_per_unit: number;
}
export interface IngredientStock {
  ingredient_id: string;
  date: string;
  remaining: number;
}
export interface IngredientQuota {
  ingredient_id: string;
  weekday: number; // 0=CN..6=T7
  quota_amount: number;
}

/** Payload client gửi lên /api/orders (server tính lại totals từ selection). */
export interface CreateOrderPayload {
  table_no: number | null;
  selection: Record<string, number>;
  pay_method: PayMethod;
  size?: "regular" | "extra";
  points_redeem?: number; // điểm khách muốn dùng để giảm giá (server kẹp trần)
}
