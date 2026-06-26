import { getServerSupabase } from "@/lib/supabase/server";
import type { PriceConfig } from "@/lib/nutrition";

/**
 * Đọc cấu hình giá hiện hành từ menu_config (admin sửa được).
 * Trả undefined nếu chưa cấu hình Supabase / chưa có dòng → computeTotals dùng mặc định menu.json.
 * Dùng chung cho /api/orders, /api/chat… để GIÁ AI tư vấn KHỚP giá builder thật.
 */
export async function getPriceConfig(): Promise<PriceConfig | undefined> {
  const supabase = getServerSupabase();
  if (!supabase) return undefined;
  const { data } = await supabase
    .from("menu_config")
    .select("base_price, extra_poke_fee, extra_base_fee, extra_topping_fee")
    .eq("id", 1)
    .maybeSingle();
  return data
    ? {
        basePrice: data.base_price,
        extraPokeFee: data.extra_poke_fee,
        extraBaseFee: data.extra_base_fee,
        extraToppingFee: data.extra_topping_fee,
      }
    : undefined;
}
