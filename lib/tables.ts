/**
 * Giới hạn số bàn của quán — NGUỒN CHÂN LÝ duy nhất (mặc định 20 bàn: 1..20).
 * Đổi env NEXT_PUBLIC_TABLE_COUNT để mở rộng/thu hẹp mà không sửa code.
 */
export const MAX_TABLE = Number(process.env.NEXT_PUBLIC_TABLE_COUNT) || 20;

/** Số bàn hợp lệ: số nguyên trong [1, MAX_TABLE]. */
export function isValidTable(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= MAX_TABLE;
}
