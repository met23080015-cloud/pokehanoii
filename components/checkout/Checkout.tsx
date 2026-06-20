"use client";

import { useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PayMethod } from "@/lib/supabase/types";
import CheckoutSummary from "./CheckoutSummary";
import PaymentChoice from "./PaymentChoice";
import VietQR from "./VietQR";
import ReviewCard from "@/components/ai/ReviewCard";

export default function Checkout({
  onBack,
  onConfirmed,
}: {
  onBack: () => void;
  onConfirmed: (orderId: string, payMethod: PayMethod, orderToken?: string) => void;
}) {
  const { selection, totals, tableNo } = useBowl();
  const [payMethod, setPayMethod] = useState<PayMethod>("counter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // gửi token nếu khách đã đăng nhập → tích điểm + lưu vào lịch sử
      const sb = getSupabaseClient();
      if (sb) {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (session) headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ table_no: tableNo, selection, pay_method: payMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không gửi được đơn");
        return;
      }
      onConfirmed(data.id, payMethod, data.order_token);
    } catch {
      setError("Lỗi kết nối, thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const orderInfo = `Poke ban ${tableNo ?? "-"}`;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-28">
      <button
        type="button"
        onClick={onBack}
        className="press self-start rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 shadow-soft"
      >
        ← Quay lại chỉnh bát
      </button>

      <CheckoutSummary selection={selection} totals={totals} />

      <ReviewCard />

      <div>
        <h3 className="mb-2 font-bold tracking-tight">Phương thức thanh toán</h3>
        <PaymentChoice value={payMethod} onChange={setPayMethod} />
      </div>

      {payMethod === "vietqr" && <VietQR amount={totals.price} orderInfo={orderInfo} />}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="press rounded-2xl bg-brand-600 px-5 py-3.5 font-bold text-white shadow-soft disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Gửi đơn tới quầy"}
      </button>
    </div>
  );
}
