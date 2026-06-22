"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

/** Tải CSV đơn — fetch kèm Bearer token rồi tải blob (vì <a> không gắn được header). */
export default function ExportButton() {
  const t = useT();
  const supabase = getSupabaseClient();
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${sess.session?.access_token}` },
      });
      if (!r.ok) throw new Error(t("admin.exportFailed"));
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "poke-orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t("admin.exportFailedAlert"));
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="press rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-soft disabled:opacity-50"
    >
      {busy ? t("admin.exportBusy") : t("admin.exportCsv")}
    </button>
  );
}
