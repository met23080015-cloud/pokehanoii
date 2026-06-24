/**
 * Giới hạn số bàn của quán — NGUỒN CHÂN LÝ duy nhất: 20 bàn (1..20).
 * Hardcode để tránh env (NEXT_PUBLIC_TABLE_COUNT cũ = 10) ghi đè ngoài ý muốn.
 */
export const MAX_TABLE = 20;

/** Số bàn hợp lệ: số nguyên trong [1, MAX_TABLE]. */
export function isValidTable(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= MAX_TABLE;
}
