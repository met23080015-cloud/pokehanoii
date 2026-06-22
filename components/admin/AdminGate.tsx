"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import LanguageToggle from "@/components/i18n/LanguageToggle";

export default function AdminGate() {
  const t = useT();
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
    if (error) setError(t("admin.gateError"));
    setLoading(false);
    // thành công → AdminAuthGate tự cập nhật qua onAuthStateChange
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-soft"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink/60">{t("admin.gateHint")}</p>
        <LanguageToggle />
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("admin.gateEmail")}
        autoComplete="email"
        className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        autoFocus
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("admin.gatePassword")}
        autoComplete="current-password"
        className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !supabase}
        className="press rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
      >
        {loading ? t("admin.gateLoggingIn") : t("admin.gateLogin")}
      </button>
      {!supabase && (
        <p className="text-xs text-amber-700">{t("admin.gateEnvMissing")}</p>
      )}
    </form>
  );
}
