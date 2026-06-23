"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useServiceRequests } from "@/lib/hooks/use-service-requests";
import ServiceRequestRow from "./ServiceRequestRow";

/**
 * Chuông thông báo (admin): gom yêu cầu tại bàn đang mở, realtime.
 * Dropdown sắp xếp CŨ → MỚI (xa nhất đến gần nhất) để xử lý theo thứ tự đến.
 */
export default function NotificationBell() {
  const t = useT();
  const { reqs, resolve } = useServiceRequests();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click ra ngoài → đóng dropdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const count = reqs.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("admin.notifTitle")}
        className="press relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-soft"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 max-w-[90vw] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-bar">
          <p className="px-2 py-1.5 text-sm font-bold text-ink">
            {t("admin.notifTitle")}
            {count > 0 && <span className="text-ink/40"> · {count}</span>}
          </p>
          {count === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink/40">
              {t("admin.notifEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {reqs.map((r) => (
                <ServiceRequestRow key={r.id} req={r} onResolve={resolve} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
