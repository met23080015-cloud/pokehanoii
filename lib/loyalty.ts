/** Loyalty redemption — đổi điểm lấy giảm giá.
 *  Quy đổi: 1 điểm = 1.000đ. Trần đổi: tối đa 50% giá trị đơn (giữ biên doanh thu).
 *  Hàm thuần (không I/O) để UI dùng + unit-test; server (place_order) vẫn là nguồn chân lý. */

/** Mỗi điểm đổi được 1.000đ giảm giá. */
export const VND_PER_POINT = 1000;

/** Điểm chỉ được bù tối đa 50% giá trị đơn. */
export const MAX_REDEEM_RATIO = 0.5;

/** Số tiền giảm tương ứng với số điểm dùng. */
export function discountForPoints(points: number): number {
  return Math.max(0, Math.floor(points)) * VND_PER_POINT;
}

/** Số điểm tối đa khách được dùng cho 1 đơn:
 *  min(số điểm đang có, trần 50% đơn). Luôn ≥ 0 và là số nguyên. */
export function maxRedeemablePoints(balance: number, subtotal: number): number {
  const byBalance = Math.max(0, Math.floor(balance));
  const byCap = Math.floor((Math.max(0, subtotal) * MAX_REDEEM_RATIO) / VND_PER_POINT);
  return Math.max(0, Math.min(byBalance, byCap));
}
