"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setPendingLoad } from "@/lib/favorites";
import { formatVND } from "@/lib/nutrition";
import { useT, useLang } from "@/lib/i18n";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import type { Order } from "@/lib/supabase/types";

export default function AccountPanel() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [points, setPoints] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadData = useCallback(
    async (uid: string) => {
      if (!supabase) return;
      const [{ data: cust }, { data: ords }] = await Promise.all([
        supabase.from("customers").select("points").eq("user_id", uid).maybeSingle(),
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setPoints((cust as { points?: number } | null)?.points ?? 0);
      setOrders((ords as Order[]) ?? []);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setStatus("out");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("in");
        setUserEmail(data.session.user.email ?? "");
        loadData(data.session.user.id);
      } else setStatus("out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setStatus("in");
        setUserEmail(session.user.email ?? "");
        loadData(session.user.id);
      } else setStatus("out");
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadData]);

  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) setError(t("account.errSendLink"));
    else setSent(true);
  }

  function reorder(o: Order) {
    const selection: Record<string, number> = {};
    o.items.forEach((it) => (selection[it.id] = it.qty));
    setPendingLoad({ selection, target: 1000 });
    router.push("/");
  }

  if (status === "loading")
    return (
      <>
        <div className="mb-3 flex justify-end">
          <LanguageToggle />
        </div>
        <p className="p-6 text-center text-ink/40">{t("account.loading")}</p>
      </>
    );

  if (status === "out")
    return (
      <>
        <div className="mb-3 flex justify-end">
          <LanguageToggle />
        </div>
        <form
          onSubmit={sendLink}
          className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-soft"
        >
          <p className="text-sm text-ink/60">{t("account.loginPrompt")}</p>
          {sent ? (
            <p className="rounded-xl bg-brand-50 p-3 text-sm font-medium text-brand-700">
              {t("account.linkSentPrefix")} <b>{email}</b>
              {t("account.linkSentSuffix")}
            </p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("account.emailPlaceholder")}
                className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                autoFocus
              />
              <button
                type="submit"
                disabled={!supabase}
                className="press rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {t("account.sendLink")}
              </button>
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            </>
          )}
          <a href="/" className="text-center text-sm font-semibold text-brand-700">
            {t("account.backToOrder")}
          </a>
        </form>
      </>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight text-brand-700">
            {userEmail.split("@")[0] || t("account.guest")}
          </p>
          <p className="truncate text-xs text-ink/50">{userEmail}</p>
          <p className="mt-1 text-sm font-semibold text-ink/70">
            {points} <span className="font-normal text-ink/40">{t("account.points")}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink/60 shadow-soft"
        >
          {t("account.signOut")}
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <h2 className="mb-2 font-bold tracking-tight">{t("account.history")}</h2>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/40">{t("account.noOrders")}</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {o.items.map((it) => it.vi + (it.qty > 1 ? `×${it.qty}` : "")).join(", ")}
                  </p>
                  <p className="text-xs text-ink/45">
                    {new Date(o.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN")} ·{" "}
                    {formatVND(o.total_price)} ·{" "}
                    {o.paid ? t("account.paidShort") : t("account.unpaidShort")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reorder(o)}
                  className="press shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700"
                >
                  {t("account.reorder")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a href="/" className="text-center text-sm font-semibold text-brand-700">
        {t("account.backToOrder")}
      </a>
    </div>
  );
}
