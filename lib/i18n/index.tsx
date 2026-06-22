"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { dict } from "./dict";

export type Lang = "vi" | "en";

type Dict = Record<string, unknown>;

/** Lấy chuỗi theo key dạng "namespace.key" trong cây dictionary. */
function lookup(obj: Dict, path: string): string | undefined {
  const v = path.split(".").reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Dict)[k] : undefined),
    obj,
  );
  return typeof v === "string" ? v : undefined;
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** t("checkout.total") → chuỗi theo ngôn ngữ hiện tại; fallback vi rồi key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  initial = "vi",
}: {
  children: ReactNode;
  initial?: Lang;
}) {
  // initial đến từ cookie đọc ở server (layout) → không lệch hydration, không nhấp nháy.
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      // cookie là nguồn chân lý (server đọc lại được); 1 năm.
      document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* ignore */
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = lookup(dict[lang], key) ?? lookup(dict.vi, key) ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}

/** Hook tiện dụng chỉ lấy hàm dịch. */
export function useT() {
  return useI18n().t;
}

/** Hook lấy ngôn ngữ hiện tại + setter (cho toggle, tên món EN/VI…). */
export function useLang() {
  const { lang, setLang } = useI18n();
  return { lang, setLang };
}
