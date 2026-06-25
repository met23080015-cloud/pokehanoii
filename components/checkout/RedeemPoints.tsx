"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/nutrition";
import { useT } from "@/lib/i18n";
import { maxRedeemablePoints, discountForPoints } from "@/lib/loyalty";

/** Ô đổi điểm ở bước checkout. Chỉ hiện khi khách ĐÃ đăng nhập và CÓ điểm.
 *  Server (place_order) vẫn kẹp trần lại — đây chỉ là UI cho khách chọn. */
export default function RedeemPoints({
  subtotal,
  value,
  onChange,
}: {
  subtotal: number;
  value: number;
  onChange: (points: number) => void;
}) {
  const t = useT();
  const [balance, setBalance] = useState<number | null>(null);

  // Lấy số điểm hiện có của khách (giống AccountPanel) — RLS chỉ cho đọc điểm của chính mình.
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) {
        if (alive) setBalance(0);
        return;
      }
      sb.from("customers")
        .select("points")
        .eq("user_id", uid)
        .maybeSingle()
        .then(({ data: cust }) => {
          if (alive) setBalance((cust as { points?: number } | null)?.points ?? 0);
        });
    });
    return () => {
      alive = false;
    };
  }, []);

  const max = maxRedeemablePoints(balance ?? 0, subtotal);

  // Đơn đổi nhỏ lại (khách bớt món) → kẹp điểm đã chọn cho khỏi vượt trần.
  // Cố tình bỏ onChange khỏi deps: chỉ chạy lại khi max/value đổi, tránh vòng lặp
  // nếu caller truyền onChange inline (đổi tham chiếu mỗi render).
  useEffect(() => {
    if (value > max) onChange(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, value]);

  // Không có điểm khả dụng → ẩn hẳn (khách vãng lai hoặc 0 điểm / đơn quá nhỏ).
  if (balance === null || max <= 0) return null;

  const used = Math.min(value, max);
  const discount = discountForPoints(used);

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold tracking-tight text-brand-700">{t("checkout.redeemTitle")}</h3>
        <span className="text-xs text-ink/50">
          {t("checkout.redeemHave")} {balance} {t("checkout.redeemPointsUnit")}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={used}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-brand-100 accent-brand-600"
          aria-label={t("checkout.redeemTitle")}
        />
        <button
          type="button"
          onClick={() => onChange(used >= max ? 0 : max)}
          className="press shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          {t("checkout.redeemMax")}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-ink/60">
          {t("checkout.redeemUse")} <b className="text-brand-700">{used}</b>{" "}
          {t("checkout.redeemPointsUnit")}
        </span>
        <span className="font-semibold text-brand-700">
          {t("checkout.redeemDiscount")} −{formatVND(discount)}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink/40">{t("checkout.redeemHint")}</p>
    </div>
  );
}
