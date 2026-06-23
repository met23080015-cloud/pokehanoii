"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useServiceRequests } from "@/lib/hooks/use-service-requests";
import ServiceRequestRow from "./ServiceRequestRow";

/**
 * Panel yêu cầu tại bàn — hiển thị ngay trên dashboard đơn hàng để không bỏ sót.
 * Cũ → mới, cuộn được, thu gọn được. Bổ trợ cho chuông ở thanh nav.
 */
export default function ServiceRequestsPanel() {
  const t = useT();
  const { reqs, resolve, enabled } = useServiceRequests();
  const [open, setOpen] = useState(true);

  if (!enabled) return null;

  const count = reqs.length;

  return (
    <section className="rounded-2xl border border-black/5 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          🔔 {t("admin.reqPanelTitle")}
          {count > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {open ? t("admin.reqPanelHide") : t("admin.reqPanelShow")}
        </span>
      </button>

      {open && (
        <div className="border-t border-black/5 p-2">
          {count === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink/40">
              {t("admin.notifEmpty")}
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {reqs.map((r) => (
                <ServiceRequestRow key={r.id} req={r} onResolve={resolve} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
