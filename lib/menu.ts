import menuData from "@/data/menu.json";

export type GroupKey =
  | "bases"
  | "proteins"
  | "mixins"
  | "sauces"
  | "toppings"
  | "crisps";

export interface MenuItem {
  id: string;
  vi: string;
  en: string;
  unit: string;
  grams: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  fiber: number | null;
  premiumFee?: number;
  /** Optional ảnh món — đặt file ở public/menu/<id>.jpg rồi set "/menu/<id>.jpg". */
  image?: string;
  /** Nhãn ăn kiêng: "seafood" (hải sản), "animal" (nguồn động vật). Không tag = thuần chay-friendly. */
  tags?: string[];
}

export type DietFilter = "vegan" | "no-seafood";

/** Món có bị ẩn theo bộ lọc ăn kiêng đang bật không. */
export function isHiddenByDiet(item: MenuItem, filters: DietFilter[]): boolean {
  const tags = item.tags ?? [];
  if (filters.includes("vegan") && (tags.includes("animal") || tags.includes("seafood")))
    return true;
  if (filters.includes("no-seafood") && tags.includes("seafood")) return true;
  return false;
}

export interface Pricing {
  currency: string;
  basePrice: number;
  extraPokeFee: number;
}

export interface Thresholds {
  proteinMin: number;
  proteinMax: number;
  fiberMin: number;
  fatMax: number;
}

const data = menuData as unknown as {
  pricing: Pricing;
  thresholds: Thresholds;
  groups: Record<GroupKey, MenuItem[]>;
};

export const pricing: Pricing = data.pricing;
export const thresholds: Thresholds = data.thresholds;
export const groups = data.groups;

export const GROUP_LABELS: Record<GroupKey, string> = {
  bases: "Lớp nền (Base)",
  proteins: "Phần đạm (Poke)",
  mixins: "Đồ trộn kèm",
  sauces: "Nước sốt (Sauce)",
  toppings: "Rau củ ăn kèm (Topping)",
  crisps: "Đồ rắc giòn (Crisp)",
};

// id -> { item, group } index for O(1) lookup
const index = new Map<string, { item: MenuItem; group: GroupKey }>();
(Object.keys(groups) as GroupKey[]).forEach((group) => {
  groups[group].forEach((item) => index.set(item.id, { item, group }));
});

export function getItem(id: string): MenuItem | undefined {
  return index.get(id)?.item;
}

export function getItemGroup(id: string): GroupKey | undefined {
  return index.get(id)?.group;
}

export function allItems(): MenuItem[] {
  return Array.from(index.values()).map((v) => v.item);
}
