import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimit, clientKey } from "@/lib/ai/rate-limit";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Chưa cấu hình ADMIN_PASSWORD" },
      { status: 503 },
    );
  }

  // chống brute-force: giới hạn số lần thử / IP
  if (!rateLimit("login:" + clientKey(req))) {
    return NextResponse.json(
      { error: "Quá nhiều lần thử, vui lòng đợi." },
      { status: 429 },
    );
  }

  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const c = await cookies();
  c.set("poke_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 giờ
  });
  return NextResponse.json({ ok: true });
}
