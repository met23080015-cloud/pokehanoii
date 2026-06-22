"use client";

import { useRouter } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";

/** Nút đổi ngôn ngữ VI | EN. Lưu vào cookie, áp dụng toàn app (user + admin).
 *  router.refresh() để server components (tiêu đề trang) cũng cập nhật ngay. */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const pick = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    router.refresh();
  };
  const opt = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => pick(l)}
      aria-pressed={lang === l}
      className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
        lang === l ? "bg-brand-600 text-white shadow-soft" : "text-ink/55"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full bg-white/80 p-0.5 shadow-soft ring-1 ring-black/5 ${className}`}
      aria-label="Language"
    >
      {opt("vi", "VI")}
      {opt("en", "EN")}
    </div>
  );
}
