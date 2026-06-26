"use client";

import { getItemGroup, itemName, type MenuItem } from "@/lib/menu";
import { formatVND } from "@/lib/nutrition";
import { useT, useLang } from "@/lib/i18n";

interface Props {
  item: MenuItem;
  qty: number;
  /** Số phần còn THÊM được (theo tồn kho). undefined = không giới hạn. */
  addable?: number;
  onInc: () => void;
  onDec: () => void;
}

const LOW_STOCK = 5; // ngưỡng hiện nhãn "còn N phần"

export default function ItemCard({ item, qty, addable, onInc, onDec }: Props) {
  const t = useT();
  const { lang } = useLang();
  const selected = qty > 0;
  const canAdd = addable === undefined || addable > 0;
  const lowStock = addable !== undefined && addable <= LOW_STOCK;
  // Đồ uống đo bằng ml; món còn lại đo bằng gram.
  const measureUnit = getItemGroup(item.id) === "drinks" ? "ml" : "g";
  // Tên chính theo ngôn ngữ đang chọn; dòng phụ là tên ngôn ngữ còn lại.
  const primary = itemName(item, lang);
  const secondary = lang === "en" ? item.vi : item.en;
  // Bấm vào BẤT KỲ đâu trên thẻ đều +1 (nếu còn tồn kho).
  const selectAction = () => {
    if (canAdd) onInc();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectAction}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectAction();
        }
      }}
      className={`press relative flex cursor-pointer select-none flex-col gap-1 rounded-2xl border p-3 text-left ${
        selected
          ? "border-brand-500 bg-brand-50 shadow-soft"
          : "border-black/5 bg-white hover:border-brand-200"
      }`}
    >
      {item.image && (
        <div className="-mx-3 -mt-3 mb-1 overflow-hidden rounded-t-2xl bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={primary}
            loading="lazy"
            className="pointer-events-none h-20 w-full object-cover"
          />
        </div>
      )}
      <span className="font-semibold leading-tight text-ink">{primary}</span>
      <span className="text-[11px] text-ink/40">{secondary}</span>

      <div className="mt-1 flex items-center justify-between text-[11px] text-ink/55">
        <span className="font-medium">
          {item.kcal ?? 0} kcal{item.grams ? ` · ${item.grams}${measureUnit}` : ""}
        </span>
        {item.price ? (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">
            {formatVND(item.price)}
          </span>
        ) : item.premiumFee ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
            +{formatVND(item.premiumFee)}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className={`text-[11px] ${lowStock ? "font-semibold text-amber-600" : "text-ink/50"}`}>
          {lowStock
            ? t("builder.stockLeft", { n: addable as number })
            : t("builder.itemProtein", { n: item.protein ?? 0 })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDec();
            }}
            disabled={qty <= 0}
            aria-label={t("builder.decrease")}
            className="press flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-lg leading-none text-ink/70 disabled:opacity-25"
          >
            −
          </button>
          <span className="w-5 text-center font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canAdd) onInc();
            }}
            disabled={!canAdd}
            aria-label={t("builder.increase")}
            className="press flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-lg leading-none text-white disabled:opacity-25"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
