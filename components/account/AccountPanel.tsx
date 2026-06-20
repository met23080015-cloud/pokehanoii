"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setPendingLoad } from "@/lib/favorites";
import { formatVND } from "@/lib/nutrition";
import type { Order } from "@/lib/supabase/types";

export default function AccountPanel() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState("");
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
        loadData(data.session.user.id);
      } else setStatus("out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setStatus("in");
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
    if (error) setError("Không gửi được link — thử lại sau ít phút.");
    else setSent(true);
  }

  function reorder(o: Order) {
    const selection: Record<string, number> = {};
    o.items.forEach((it) => (selection[it.id] = it.qty));
    setPendingLoad({ selection, target: 1000 });
    router.push("/");
  }

  if (status === "loading")
    return <p className="p-6 text-center text-ink/40">Đang tải…</p>;

  if (status === "out")
    return (
      <form
        onSubmit={sendLink}
        className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-soft"
      >
        <p className="text-sm text-ink/60">
          Đăng nhập để tích điểm và xem lịch sử đơn. Khách vãng lai vẫn đặt món bình thường.
        </p>
        {sent ? (
          <p className="rounded-xl bg-brand-50 p-3 text-sm font-medium text-brand-700">
            Đã gửi link đăng nhập tới <b>{email}</b>. Mở email và bấm vào link.
          </p>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              autoFocus
            />
            <button
              type="submit"
              disabled={!supabase}
              className="press rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
            >
              Gửi link đăng nhập
            </button>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </>
        )}
        <a href="/" className="text-center text-sm font-semibold text-brand-700">
          ← Về đặt món
        </a>
      </form>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft">
        <div>
          <p className="text-xs text-ink/50">Điểm thưởng</p>
          <p className="text-3xl font-extrabold tracking-tight text-brand-700">
            {points}
            <span className="text-base text-ink/40"> điểm</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="press rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink/60 shadow-soft"
        >
          Đăng xuất
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft">
        <h2 className="mb-2 font-bold tracking-tight">Lịch sử đơn</h2>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/40">Chưa có đơn nào.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {o.items.map((it) => it.vi + (it.qty > 1 ? `×${it.qty}` : "")).join(", ")}
                  </p>
                  <p className="text-xs text-ink/45">
                    {new Date(o.created_at).toLocaleDateString("vi-VN")} ·{" "}
                    {formatVND(o.total_price)} · {o.paid ? "đã trả" : "chưa trả"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reorder(o)}
                  className="press shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700"
                >
                  Đặt lại
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a href="/" className="text-center text-sm font-semibold text-brand-700">
        ← Về đặt món
      </a>
    </div>
  );
}
