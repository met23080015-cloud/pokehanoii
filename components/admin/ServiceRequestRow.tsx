"use client";

import { useT } from "@/lib/i18n";
import { formatAgo } from "@/lib/hooks/use-service-requests";
import type { ServiceRequest } from "@/lib/supabase/types";

const LABEL_KEY: Record<string, string> = {
  service: "admin.svcService",
  bill: "admin.svcBill",
  feedback: "admin.svcFeedback",
};

/** Một dòng yêu cầu tại bàn — dùng chung cho chuông và panel dashboard. */
export default function ServiceRequestRow({
  req,
  onResolve,
}: {
  req: ServiceRequest;
  onResolve: (id: string) => void;
}) {
  const t = useT();
  return (
    <li className="flex items-start justify-between gap-2 rounded-xl bg-sand p-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">
          {req.table_no != null
            ? `${t("common.table")} ${req.table_no}`
            : t("admin.guest")}{" "}
          · {LABEL_KEY[req.type] ? t(LABEL_KEY[req.type]) : req.type}
        </p>
        {req.note && (
          <p className="break-words text-xs text-ink/55">{req.note}</p>
        )}
        <p className="mt-0.5 text-[11px] text-ink/40">{formatAgo(req.created_at, t)}</p>
      </div>
      <button
        type="button"
        onClick={() => onResolve(req.id)}
        className="press shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"
      >
        {t("admin.svcResolved")}
      </button>
    </li>
  );
}
