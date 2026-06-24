"use client";

import { useEffect, useState } from "react";
import { MAX_TABLE } from "@/lib/tables";
import { useT } from "@/lib/i18n";
import { LogoMark } from "@/components/brand/Logo";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

export default function QrPage() {
  const t = useT();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const tables = Array.from({ length: MAX_TABLE }, (_, i) => i + 1);

  function qrUrl(table: number) {
    const target = `${origin}/?table=${table}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      target,
    )}`;
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        {t("admin.qrTitle")}
      </h1>
      <AdminAuthGate>
        <p
          className="text-sm text-ink/55"
          dangerouslySetInnerHTML={{
            __html: t("admin.qrHint", {
              code: '<code class="rounded bg-sand px-1">/?table=N</code>',
            }),
          }}
        />

        {!origin ? (
          <p className="mt-4 text-ink/40">{t("admin.qrGenerating")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {tables.map((tbl) => (
              <div
                key={tbl}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/5 bg-white p-3 shadow-soft"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl(tbl)} alt={t("admin.qrTableAlt", { table: tbl })} className="h-40 w-40" />
                <span className="font-bold">{t("admin.qrTableLabel", { table: tbl })}</span>
                <a
                  href={qrUrl(tbl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-700 underline"
                >
                  {t("admin.qrOpenImage")}
                </a>
              </div>
            ))}
          </div>
        )}
      </AdminAuthGate>
    </main>
  );
}
