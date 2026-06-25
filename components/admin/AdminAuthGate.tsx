"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import AdminGate from "./AdminGate";
import AdminDashboard from "./AdminDashboard";
import AdminNav from "./AdminNav";

type Status = "loading" | "out" | "in";

// Nhớ kết quả kiểm tra staff theo user (sống qua các lần chuyển trang admin) →
// đổi trang không phải hỏi lại DB nên không nháy về màn "đang kiểm tra".
// Reset khi đăng xuất / đổi user.
let staffCache: { uid: string; isStaff: boolean } | null = null;

export default function AdminAuthGate({ children }: { children?: React.ReactNode }) {
  const t = useT();
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus("out");
      return;
    }
    let active = true;
    let currentUid: string | null = null;

    const apply = (session: Session | null) => {
      currentUid = session?.user.id ?? null;
      setUid(currentUid);
      setStatus(session ? "in" : "out");
      setEmail(session?.user.email ?? "");
      if (!session) {
        staffCache = null;
        setIsStaff(null);
      } else if (staffCache?.uid === session.user.id) {
        setIsStaff(staffCache.isStaff); // dùng lại cache → khỏi nháy loading
      } else {
        setIsStaff(null); // user mới → cần kiểm tra lại
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (active) apply(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const newUid = session?.user.id ?? null;
      // Sự kiện làm mới token của CÙNG user (tab focus lại, token hết hạn tự gia hạn…)
      // → giữ nguyên UI, KHÔNG reset state để khỏi nháy về màn trống / bị treo.
      if (newUid === currentUid && event !== "SIGNED_OUT") return;
      apply(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Kiểm tra allowlist staff — chỉ chạy khi chưa biết (isStaff === null).
  // RLS: chỉ đọc được dòng staff của chính mình → có dòng = là staff.
  useEffect(() => {
    if (status !== "in" || !supabase || isStaff !== null) return;
    let active = true;
    supabase
      .from("staff")
      .select("user_id")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const ok = !!data;
        if (uid) staffCache = { uid, isStaff: ok };
        setIsStaff(ok);
      });
    return () => {
      active = false;
    };
  }, [status, supabase, isStaff, uid]);

  if (status === "loading" || (status === "in" && isStaff === null))
    return <p className="p-6 text-center text-ink/40">{t("admin.checkingLogin")}</p>;

  if (status === "out") return <AdminGate />;

  if (isStaff === false)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
        <p
          className="text-sm text-amber-800"
          dangerouslySetInnerHTML={{ __html: t("admin.notStaff", { email }) }}
        />
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press rounded-xl border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800"
        >
          {t("admin.signOut")}
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-sm text-ink/55">
        <AdminNav />
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press shrink-0 rounded-full bg-white px-3 py-1 font-semibold text-brand-700 shadow-soft"
        >
          {t("admin.signOut")}
        </button>
      </div>
      {children ?? <AdminDashboard />}
    </div>
  );
}
