"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { useBowl } from "@/lib/store/bowl";
import QuickActions from "./QuickActions";

// TODO: thay bằng địa chỉ thật của quán
const STORE_NAME = "Poke Hanoi";
const STORE_AREA = "Hà Nội";

function greeting(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chúc bạn ngon miệng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/**
 * Màn hình bắt đầu trước khi gọi món — bám theo flow o2o của iPOS:
 * hero thương hiệu (gộp header) → lời chào theo giờ + số bàn → tích điểm → thao tác nhanh → CTA.
 */
export default function WelcomeScreen({
  tableNo,
  onStart,
}: {
  tableNo: number | null;
  onStart: () => void;
}) {
  const router = useRouter();
  const { setTable } = useBowl();
  const [tbl, setTbl] = useState("");

  // Tính giờ sau khi mount để tránh lệch hydration (server UTC vs client local)
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);
  const greet = hour == null ? "Xin chào" : greeting(hour);

  function confirmTable(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(tbl, 10);
    if (n <= 0) return;
    setTable(n); // cập nhật state ngay (UI đổi tức thì)
    router.replace(`/?table=${n}`); // đồng bộ URL để refresh giữ được bàn
  }

  return (
    <main className="fade-in mx-auto flex max-w-md flex-col gap-3.5 px-4 pb-10 pt-5">
      {/* Hero thương hiệu (gộp tên quán + tài khoản + tiêu đề) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-soft">
        <div className="pointer-events-none absolute -bottom-7 -right-5 opacity-[0.13]">
          <LogoMark className="h-44 w-44 text-white" />
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7 text-white" />
            <div>
              <p className="text-sm font-bold leading-tight">{STORE_NAME}</p>
              <p className="flex items-center gap-1 text-xs text-white/70">
                <span aria-hidden>📍</span> {STORE_AREA}
              </p>
            </div>
          </div>
          <a
            href="/account"
            aria-label="Tài khoản"
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg backdrop-blur"
          >
            👤
          </a>
        </div>

        <div className="relative mt-9">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Thực đơn điện tử
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold leading-tight">
            Poke bowl
            <br />
            theo mục tiêu calo
          </h1>
        </div>
      </section>

      {/* Lời chào + bàn */}
      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <p className="text-base font-bold text-ink">👋 {greet}!</p>
        {tableNo != null ? (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink/60">
            Món sẽ được phục vụ tại
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-bold text-brand-700">
              Bàn {tableNo}
            </span>
          </p>
        ) : (
          <div className="mt-1.5">
            <p className="text-sm text-ink/60">
              Bạn đang ngồi bàn số mấy? Nhập để nhân viên phục vụ đúng chỗ:
            </p>
            <form onSubmit={confirmTable} className="mt-2 flex gap-2">
              <input
                inputMode="numeric"
                value={tbl}
                onChange={(e) => setTbl(e.target.value.replace(/\D/g, ""))}
                placeholder="Số bàn"
                className="w-24 rounded-xl border border-black/10 bg-sand px-3 py-2 text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                disabled={!tbl.trim()}
                className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Xác nhận
              </button>
            </form>
            <p className="mt-1.5 text-xs text-ink/40">
              Hoặc xem thực đơn trước, chọn bàn sau cũng được.
            </p>
          </div>
        )}
      </section>

      {/* Tích điểm */}
      <a
        href="/account"
        className="press flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-soft"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-lg">
            🎁
          </span>
          <span className="text-sm font-semibold text-ink">
            Đăng nhập để tích điểm
          </span>
        </span>
        <span className="text-lg text-ink/30">›</span>
      </a>

      {/* Thao tác nhanh (chỉ khi có bàn) */}
      {tableNo != null && <QuickActions tableNo={tableNo} />}

      {/* CTA */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onStart}
          className="press w-full rounded-2xl bg-brand-600 py-4 text-base font-bold text-white shadow-soft hover:bg-brand-700"
        >
          Xem thực đơn – Gọi món →
        </button>
        <p className="mt-3 text-center text-xs text-ink/40">
          Cảm ơn bạn đã ghé Poke Hanoi 💚
        </p>
      </div>
    </main>
  );
}
