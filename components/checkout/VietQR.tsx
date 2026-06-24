"use client";

import { formatVND } from "@/lib/nutrition";
import { useT } from "@/lib/i18n";

/**
 * Mã QR chuyển khoản (chuẩn VietQR/NAPAS) sinh qua SePay.
 * `payCode` được đặt làm NỘI DUNG chuyển khoản → SePay đối soát tự động khi tiền vào.
 * Khách KHÔNG cần sửa nội dung: app banking điền sẵn từ QR.
 */
export default function VietQR({
  amount,
  payCode,
}: {
  amount: number;
  payCode: string;
}) {
  const t = useT();
  const bank = process.env.NEXT_PUBLIC_VIETQR_BANK;
  const account = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT;

  if (!bank || !account) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
        {t("checkout.vietqrNotConfigured")}
      </div>
    );
  }

  const url =
    `https://qr.sepay.vn/img?acc=${encodeURIComponent(account)}` +
    `&bank=${encodeURIComponent(bank)}` +
    `&amount=${amount}&des=${encodeURIComponent(payCode)}`;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="VietQR" className="h-60 w-60 object-contain" />
      <p className="text-sm font-medium">
        {t("checkout.vietqrAmount")}: {formatVND(amount)}
      </p>
      <p className="text-xs text-neutral-500">
        {t("checkout.vietqrInfo")}: <span className="font-mono font-semibold">{payCode}</span>
      </p>
    </div>
  );
}
