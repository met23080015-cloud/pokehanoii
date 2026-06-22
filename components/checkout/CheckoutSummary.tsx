"use client";

import { getItem, getItemGroup, itemName } from "@/lib/menu";
import { useBowl } from "@/lib/store/bowl";
import { formatVND, type BowlSize, type Totals } from "@/lib/nutrition";
import type { Selection } from "@/lib/nutrition";
import { useT, useLang } from "@/lib/i18n";

// Nhóm chỉnh được SỐ LƯỢNG (>1 hợp lý); nhóm khác chỉ bật/tắt → chỉ cho xoá.
const QTY_GROUPS = new Set(["proteins", "drinks"]);

/** Nút ± / xoá cho 1 dòng món — chỉ hiện khi editable. Sửa selection qua store
 *  → totals/giá/VietQR ở Checkout tự cập nhật live. */
function LineControls({ id, qty }: { id: string; qty: number }) {
  const t = useT();
  const { setQty } = useBowl();
  const isQty = QTY_GROUPS.has(getItemGroup(id) ?? "");
  const btn =
    "press flex h-7 w-7 items-center justify-center rounded-full text-base font-bold leading-none";

  if (!isQty) {
    return (
      <button
        type="button"
        onClick={() => setQty(id, 0)}
        aria-label={t("checkout.removeItem")}
        className={`${btn} bg-red-50 text-red-500`}
      >
        ✕
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setQty(id, qty - 1)}
        aria-label={t("checkout.decrease")}
        className={`${btn} bg-sand text-ink/70`}
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => setQty(id, qty + 1)}
        aria-label={t("checkout.increase")}
        className={`${btn} bg-brand-600 text-white`}
      >
        +
      </button>
    </div>
  );
}

export default function CheckoutSummary({
  selection,
  totals,
  size = "regular",
  editable = false,
}: {
  selection: Selection;
  totals: Totals;
  size?: BowlSize;
  /** Bật ± / xoá món ngay tại bước xác nhận (luồng AI verdict). */
  editable?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const lines = Object.entries(selection).filter(([, q]) => (q || 0) > 0);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold tracking-tight">{t("checkout.yourBowl")}</h3>
        {editable && <span className="text-xs text-ink/40">{t("checkout.tapToEdit")}</span>}
      </div>
      <p className="mb-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
        {size === "extra" ? t("checkout.sizeExtra") : t("checkout.sizeRegular")}
      </p>
      <ul className="divide-y divide-black/5 text-sm">
        {lines.map(([id, qty]) => {
          const it = getItem(id);
          return (
            <li key={id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-ink/80">
                {it ? itemName(it, lang) : id}
                {!editable && qty > 1 && (
                  <span className="font-semibold text-brand-600"> ×{qty}</span>
                )}
              </span>
              {editable ? (
                <LineControls id={id} qty={qty} />
              ) : (
                <span className="text-ink/45 tabular-nums">
                  {Math.round((it?.kcal ?? 0) * qty)} kcal
                </span>
              )}
            </li>
          );
        })}
        {lines.length === 0 && (
          <li className="py-3 text-center text-sm text-ink/40">
            {t("checkout.emptyBowl")}
          </li>
        )}
      </ul>

      <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-sand p-2.5 text-center text-[11px] text-ink/55">
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.kcal}</div>kcal</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.protein}g</div>{t("checkout.macroProtein")}</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.fat}g</div>{t("checkout.macroFat")}</div>
        <div><div className="text-base font-bold text-ink tabular-nums">{totals.fiber}g</div>{t("checkout.macroFiber")}</div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="font-semibold text-ink/70">{t("checkout.total")}</span>
        <span className="text-xl font-extrabold tracking-tight">{formatVND(totals.price)}</span>
      </div>
    </div>
  );
}
