"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import VietQR from "./VietQR";

/**
 * Màn "chờ thanh toán" sau khi đặt đơn VietQR.
 * Hiện QR (nội dung = pay_code) + poll trạng thái paid qua get_order_by_token.
 * SePay nhận tiền → webhook set paid=true → màn này tự phát hiện và chuyển tiếp.
 * Khách cũng có thể bấm tiếp thủ công (đơn vẫn tự xác nhận ở trang theo dõi).
 */
export default function PaymentWaiting({
  orderId,
  orderToken,
  payCode,
  amount,
  tableNo,
  onDone,
}: {
  orderId: string;
  orderToken?: string;
  payCode: string;
  amount: number;
  tableNo: number | null;
  onDone: () => void;
}) {
  const t = useT();
  const supabase = getSupabaseClient();
  const [paid, setPaid] = useState(false);
  const shortId = orderId.slice(0, 8).toUpperCase();

  // Poll trạng thái thanh toán mỗi 3s.
  useEffect(() => {
    if (!supabase || !orderToken) return;
    let active = true;
    const check = async () => {
      const { data } = await supabase.rpc("get_order_by_token", { p_token: orderToken });
      const o = Array.isArray(data) ? data[0] : data;
      if (active && o?.paid) setPaid(true);
    };
    check();
    const id = setInterval(check, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [supabase, orderToken]);

  // Đã nhận tiền → hiện tick rồi tự chuyển sang màn xác nhận.
  useEffect(() => {
    if (!paid) return;
    const id = setTimeout(onDone, 1400);
    return () => clearTimeout(id);
  }, [paid, onDone]);

  if (paid) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-5xl">
          ✅
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-brand-700">
          {t("checkout.paidDetected")}
        </h2>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-28">
      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight">{t("checkout.payScanTitle")}</h2>
        <p className="mt-1 text-sm text-ink/55">
          {t("order.orderCode")}{" "}
          <span className="font-mono font-bold text-brand-700">#{shortId}</span>
          {tableNo != null && (
            <>
              {" · "}
              {t("order.table")} <span className="font-bold text-ink">{tableNo}</span>
            </>
          )}
        </p>
      </div>

      <VietQR amount={amount} payCode={payCode} />

      <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm font-medium text-brand-700">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
        {t("checkout.payWaiting")}
      </div>
      <p className="text-center text-xs text-ink/45">{t("checkout.payAutoConfirm")}</p>

      <button
        type="button"
        onClick={onDone}
        className="press rounded-2xl border border-brand-600 px-5 py-3 font-bold text-brand-700"
      >
        {t("checkout.payManualDone")}
      </button>
    </div>
  );
}
