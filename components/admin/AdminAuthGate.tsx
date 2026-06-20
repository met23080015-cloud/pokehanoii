"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import AdminGate from "./AdminGate";
import AdminDashboard from "./AdminDashboard";

type Status = "loading" | "out" | "in";

export default function AdminAuthGate() {
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus("out");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "in" : "out");
      setEmail(data.session?.user.email ?? "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus(session ? "in" : "out");
      setEmail(session?.user.email ?? "");
      setIsStaff(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Khi đã đăng nhập → kiểm tra có trong allowlist staff không (RLS: chỉ đọc được dòng của mình)
  useEffect(() => {
    if (status !== "in" || !supabase) return;
    supabase
      .from("staff")
      .select("user_id")
      .maybeSingle()
      .then(({ data }) => setIsStaff(!!data));
  }, [status, supabase]);

  if (status === "loading" || (status === "in" && isStaff === null))
    return <p className="p-6 text-center text-ink/40">Đang kiểm tra đăng nhập…</p>;

  if (status === "out") return <AdminGate />;

  if (isStaff === false)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-800">
          Tài khoản <b>{email}</b> chưa được cấp quyền nhân viên.
        </p>
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press rounded-xl border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800"
        >
          Đăng xuất
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-ink/55">
        <span>👤 {email}</span>
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press rounded-full bg-white px-3 py-1 font-semibold text-brand-700 shadow-soft"
        >
          Đăng xuất
        </button>
      </div>
      <AdminDashboard />
    </div>
  );
}
