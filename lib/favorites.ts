import type { Selection } from "@/lib/nutrition";

export interface SavedBowl {
  name: string;
  selection: Selection;
  target: number;
}
export type RecentBowl = Omit<SavedBowl, "name">;

const FAV_KEY = "poke_favorites";
const RECENT_KEY = "poke_recent";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getFavorites(): SavedBowl[] {
  return read<SavedBowl[]>(FAV_KEY, []);
}

export function saveFavorite(bowl: SavedBowl) {
  if (typeof window === "undefined") return;
  const key = bowl.name.toLowerCase();
  const list = getFavorites().filter((x) => x.name.toLowerCase() !== key);
  list.unshift(bowl);
  localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, 20)));
}

export function removeFavorite(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    FAV_KEY,
    JSON.stringify(getFavorites().filter((x) => x.name !== name)),
  );
}

export function setRecent(bowl: RecentBowl) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(bowl));
}

export function getRecent(): RecentBowl | null {
  return read<RecentBowl | null>(RECENT_KEY, null);
}
