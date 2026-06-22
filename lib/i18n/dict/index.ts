import { common } from "./common";
import { welcome } from "./welcome";
import { builder } from "./builder";
import { checkout } from "./checkout";
import { order } from "./order";
import { account } from "./account";
import { admin } from "./admin";
import { ai } from "./ai";

export interface Slice {
  vi: Record<string, unknown>;
  en: Record<string, unknown>;
}

// Mỗi slice sở hữu 1 namespace riêng (welcome/builder/checkout…) → gộp top-level
// không đè nhau. Thêm vùng mới: tạo slice + thêm vào mảng này.
const slices: Slice[] = [common, welcome, builder, checkout, order, account, admin, ai];

function merge(lang: "vi" | "en"): Record<string, unknown> {
  return Object.assign({}, ...slices.map((s) => s[lang]));
}

export const dict: Record<"vi" | "en", Record<string, unknown>> = {
  vi: merge("vi"),
  en: merge("en"),
};
