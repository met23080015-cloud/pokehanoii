"use client";

import { formatVND } from "@/lib/nutrition";

export default function VietQR({
  amount,
  orderInfo,
}: {
  amount: number;
  orderInfo: string;
}) {
  const bank = process.env.NEXT_PUBLIC_VIETQR_BANK;
  const account = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT;
  const name = process.env.NEXT_PUBLIC_VIETQR_NAME || "";

  if (!bank || !account) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
        Chưa cấu hình tài khoản VietQR (NEXT_PUBLIC_VIETQR_*). Vui lòng trả tại quầy.
      </div>
    );
  }

  const url =
    `https://img.vietqr.io/image/${bank}-${account}-compact2.png` +
    `?amount=${amount}&addInfo=${encodeURIComponent(orderInfo)}` +
    `&accountName=${encodeURIComponent(name)}`;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="VietQR" className="h-60 w-60 object-contain" />
      <p className="text-sm font-medium">Số tiền: {formatVND(amount)}</p>
      <p className="text-xs text-neutral-500">Nội dung: {orderInfo}</p>
    </div>
  );
}
