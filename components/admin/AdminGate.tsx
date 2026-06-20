"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Sai mật khẩu");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-soft">
      <p className="text-sm text-ink/60">Nhập mật khẩu quản lý để xem đơn.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        className="rounded-xl border border-black/10 bg-sand px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        autoFocus
      />
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="press rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Đang vào…" : "Đăng nhập"}
      </button>
    </form>
  );
}
