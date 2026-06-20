"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AdminGate() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Sai email hoặc mật khẩu");
    setLoading(false);
    // thành công → AdminAuthGate tự cập nhật qua onAuthStateChange
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-soft"
    >
      <p className="text-sm text-ink/60">Đăng nhập nhân viên để quản lý đơn.</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        autoFocus
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        autoComplete="current-password"
        className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !supabase}
        className="press rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Đang vào…" : "Đăng nhập"}
      </button>
      {!supabase && (
        <p className="text-xs text-amber-700">Supabase chưa cấu hình (thiếu env).</p>
      )}
    </form>
  );
}
