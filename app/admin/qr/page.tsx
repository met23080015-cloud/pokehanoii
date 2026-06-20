"use client";

import { useEffect, useState } from "react";

export default function QrPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const count = Number(process.env.NEXT_PUBLIC_TABLE_COUNT) || 10;
  const tables = Array.from({ length: count }, (_, i) => i + 1);

  function qrUrl(table: number) {
    const target = `${origin}/?table=${table}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      target,
    )}`;
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-extrabold tracking-tight text-brand-700">Mã QR theo bàn</h1>
      <p className="mb-4 text-sm text-ink/55">
        Mỗi mã trỏ tới trang order kèm số bàn (<code className="rounded bg-sand px-1">/?table=N</code>). In ra và dán lên
        bàn. Quét bằng camera điện thoại để kiểm tra.
      </p>

      {!origin ? (
        <p className="text-ink/40">Đang tạo mã…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tables.map((t) => (
            <div
              key={t}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/5 bg-white p-3 shadow-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl(t)} alt={`QR bàn ${t}`} className="h-40 w-40" />
              <span className="font-bold">Bàn {t}</span>
              <a
                href={qrUrl(t)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand-700 underline"
              >
                Tải / mở ảnh
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
