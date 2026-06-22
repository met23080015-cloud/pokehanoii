import menuData from "@/data/menu.json";

export type GroupKey =
  | "bases"
  | "proteins"
  | "mixins"
  | "sauces"
  | "toppings"
  | "crisps"
  | "drinks";

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
  /** Giá bán riêng (đồ uống) — món tính theo giá này, không dùng giá bowl. */
  price?: number;
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
  drinks: "Đồ uống (Drinks)",
};

/** Nhãn nhóm tiếng Anh — song song GROUP_LABELS, chọn theo ngôn ngữ. */
export const GROUP_LABELS_EN: Record<GroupKey, string> = {
  bases: "Base",
  proteins: "Protein (Poke)",
  mixins: "Mix-ins",
  sauces: "Sauce",
  toppings: "Toppings",
  crisps: "Crisps",
  drinks: "Drinks",
};

export function groupLabel(group: GroupKey, lang: "vi" | "en"): string {
  return (lang === "en" ? GROUP_LABELS_EN : GROUP_LABELS)[group];
}

/** Tên món theo ngôn ngữ (menu.json đã có sẵn cả vi/en). */
export function itemName(item: Pick<MenuItem, "vi" | "en">, lang: "vi" | "en"): string {
  return lang === "en" ? item.en : item.vi;
}

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
