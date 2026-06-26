"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatVND } from "@/lib/nutrition";
import { useT } from "@/lib/i18n";

/** Sửa giá bán (basePrice + phụ phí đạm) — áp dụng realtime cho builder khách. */
export default function PriceConfigEditor() {
  const t = useT();
  const supabase = getSupabaseClient();
  const [base, setBase] = useState<number | "">("");
  const [extra, setExtra] = useState<number | "">("");
  const [baseFee, setBaseFee] = useState<number | "">("");
  const [topFee, setTopFee] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let on = true;
    supabase
      .from("menu_config")
      .select("base_price, extra_poke_fee, extra_base_fee, extra_topping_fee")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (on && data) {
          setBase(data.base_price);
          setExtra(data.extra_poke_fee);
          setBaseFee(data.extra_base_fee);
          setTopFee(data.extra_topping_fee);
        }
      });
    return () => {
      on = false;
    };
  }, [supabase]);

  async function save() {
    if (!supabase || base === "" || extra === "" || baseFee === "" || topFee === "") return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("menu_config")
      .update({
        base_price: Number(base),
        extra_poke_fee: Number(extra),
        extra_base_fee: Number(baseFee),
        extra_topping_fee: Number(topFee),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      alert(t("admin.saveFailed"));
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const input =
    "mt-1 block w-36 rounded-xl border border-black/10 bg-sand px-3 py-2 font-semibold tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
      <h2 className="mb-2 text-sm font-bold text-ink/70">{t("admin.priceTitle")}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="text-ink/55">{t("admin.priceBaseLabel")}</span>
          <input
            type="number"
            value={base}
            onChange={(e) => setBase(e.target.value === "" ? "" : Number(e.target.value))}
            className={input}
          />
        </label>
        <label className="text-sm">
          <span className="text-ink/55">{t("admin.priceExtraLabel")}</span>
          <input
            type="number"
            value={extra}
            onChange={(e) => setExtra(e.target.value === "" ? "" : Number(e.target.value))}
            className={input}
          />
        </label>
        <label className="text-sm">
          <span className="text-ink/55">{t("admin.priceBaseFeeLabel")}</span>
          <input
            type="number"
            value={baseFee}
            onChange={(e) => setBaseFee(e.target.value === "" ? "" : Number(e.target.value))}
            className={input}
          />
        </label>
        <label className="text-sm">
          <span className="text-ink/55">{t("admin.priceTopFeeLabel")}</span>
          <input
            type="number"
            value={topFee}
            onChange={(e) => setTopFee(e.target.value === "" ? "" : Number(e.target.value))}
            className={input}
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving || base === "" || extra === "" || baseFee === "" || topFee === ""}
          className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("admin.priceSaving") : saved ? t("admin.priceSaved") : t("admin.priceSave")}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink/40">
        {t("admin.priceNote")}
        {base !== "" && t("admin.priceCurrent", { price: formatVND(Number(base)) })}
      </p>
    </section>
  );
}
