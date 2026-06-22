"use client";

import { useEffect, useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import { useT } from "@/lib/i18n";
import {
  getFavorites,
  getRecent,
  saveFavorite,
  removeFavorite,
  type SavedBowl,
  type RecentBowl,
} from "@/lib/favorites";

export default function FavoritesBar() {
  const { selection, calorieTarget, totals, loadSelection } = useBowl();
  const t = useT();
  const [favs, setFavs] = useState<SavedBowl[]>([]);
  const [recent, setRecent_] = useState<RecentBowl | null>(null);

  useEffect(() => {
    setFavs(getFavorites());
    setRecent_(getRecent());
  }, []);

  const hasSelection = totals.kcal > 0;

  function save() {
    const name = window.prompt(t("builder.namePrompt"));
    if (!name?.trim()) return;
    saveFavorite({ name: name.trim(), selection, target: calorieTarget });
    setFavs(getFavorites());
  }

  function del(name: string) {
    removeFavorite(name);
    setFavs(getFavorites());
  }

  if (!recent && favs.length === 0 && !hasSelection) return null;

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        {recent && (
          <button
            type="button"
            onClick={() => loadSelection(recent.selection, recent.target)}
            className="press rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700"
          >
            {t("builder.reorderLast")}
          </button>
        )}
        {hasSelection && (
          <button
            type="button"
            onClick={save}
            className="press rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink/65 shadow-soft"
          >
            {t("builder.saveBowl")}
          </button>
        )}
      </div>

      {favs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink/45">{t("builder.savedBowls")}</span>
          {favs.map((f) => (
            <span
              key={f.name}
              className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-sm"
            >
              <button
                type="button"
                onClick={() => loadSelection(f.selection, f.target)}
                className="font-semibold text-brand-700"
              >
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => del(f.name)}
                aria-label={t("builder.delete")}
                className="text-ink/30 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
