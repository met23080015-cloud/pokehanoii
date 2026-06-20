/** Rate limiter in-memory đơn giản (đủ cho prototype 1 instance). */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX = 15; // 15 request / phút / IP

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX) return false;
  rec.count++;
  return true;
}

export function clientKey(req: Request): string {
  // x-real-ip do Vercel set (client không spoof được) — ưu tiên trước.
  // x-forwarded-for leftmost là client-controlled nên chỉ dùng làm fallback.
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "anon"
  );
}
