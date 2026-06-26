import type { Slice } from "./index";

/** Trình build bowl (CalorieTarget, SizeSelector, GroupStep, ItemCard,
 *  DietaryFilter, FavoritesBar, NutritionSidebar, QuickActions, OrderBuilder).
 *  Namespace "builder". */
export const builder: Slice = {
  vi: {
    builder: {
      // CalorieTarget
      calorieTitle: "Hôm nay bạn muốn ăn",
      calorieCustom: "Tùy chỉnh",
      // SizeSelector
      sizeTitle: "Cỡ bát",
      sizeHint: "Giá cơ bản đã bao gồm 1 phần đạm.",
      sizeRegularTitle: "Bát vừa (Regular)",
      sizeRegularDesc: "Khẩu phần tiêu chuẩn",
      sizeExtraTitle: "Bát Extra Poke",
      sizeExtraDesc: "Thêm 1 phần đạm",
      // ItemCard
      itemProtein: "{n}g đạm",
      stockLeft: "Còn {n} phần",
      decrease: "Bớt",
      increase: "Thêm",
      // DietaryFilter
      filterLabel: "Lọc:",
      filterVegan: "🌱 Món chay",
      filterNoSeafood: "🚫🦐 Không hải sản",
      // FavoritesBar
      reorderLast: "↺ Đặt lại đơn gần nhất",
      saveBowl: "☆ Lưu bát này",
      savedBowls: "Bát đã lưu:",
      namePrompt: "Đặt tên cho bát này:",
      delete: "Xóa",
      // NutritionSidebar
      over: "Vượt {n}",
      remaining: "Còn {n}",
      subtotal: "Tạm tính",
      viewOrder: "Xem đơn →",
      // QuickActions
      callService: "Gọi phục vụ",
      askBill: "Xin thanh toán",
      feedback: "Góp ý",
      sent: "Đã gửi",
      sending: "Đang gửi…",
      sendError: "Gửi không thành công, thử lại nhé.",
      feedbackTitle: "Góp ý cho quán",
      feedbackPlaceholder: "Chia sẻ trải nghiệm hoặc yêu cầu của bạn…",
      feedbackSend: "Gửi góp ý",
      // OrderBuilder — help từng bước
      helpBases: "Chọn lớp nền cho bát — lớp đầu đã gồm trong giá, thêm lớp nữa tính phụ phí.",
      helpProteins: "Thêm/bớt muỗng đạm — muỗng đầu đã tính trong giá.",
      helpMixins: "Thêm/bớt đồ trộn — mỗi phần tính thêm phí.",
      helpSauces: "Thêm/bớt sốt tuỳ khẩu vị — mỗi phần tính thêm phí.",
      helpToppings: "Thêm/bớt rau củ ăn kèm — mỗi phần tính thêm phí.",
      helpCrisps: "Thêm/bớt đồ rắc giòn — mỗi phần tính thêm phí.",
      helpDrinks: "Đồ uống mát lạnh — tính giá riêng (tùy chọn).",
    },
  },
  en: {
    builder: {
      // CalorieTarget
      calorieTitle: "What you'd like today",
      calorieCustom: "Custom",
      // SizeSelector
      sizeTitle: "Bowl size",
      sizeHint: "Base price includes 1 protein.",
      sizeRegularTitle: "Regular bowl",
      sizeRegularDesc: "Standard portion",
      sizeExtraTitle: "Extra Poke bowl",
      sizeExtraDesc: "Adds 1 protein",
      // ItemCard
      itemProtein: "{n}g protein",
      stockLeft: "{n} left",
      decrease: "Decrease",
      increase: "Increase",
      // DietaryFilter
      filterLabel: "Filter:",
      filterVegan: "🌱 Vegan",
      filterNoSeafood: "🚫🦐 No seafood",
      // FavoritesBar
      reorderLast: "↺ Reorder last bowl",
      saveBowl: "☆ Save this bowl",
      savedBowls: "Saved bowls:",
      namePrompt: "Name this bowl:",
      delete: "Delete",
      // NutritionSidebar
      over: "Over {n}",
      remaining: "{n} left",
      subtotal: "Subtotal",
      viewOrder: "View order →",
      // QuickActions
      callService: "Call staff",
      askBill: "Request bill",
      feedback: "Feedback",
      sent: "Sent",
      sending: "Sending…",
      sendError: "Couldn't send, please try again.",
      feedbackTitle: "Send us feedback",
      feedbackPlaceholder: "Share your experience or request…",
      feedbackSend: "Send feedback",
      // OrderBuilder — step help
      helpBases: "Pick your base — the first is included, extra bases add a surcharge.",
      helpProteins: "Add or remove protein scoops — the first is included in price.",
      helpMixins: "Add or remove mix-ins — each portion adds a fee.",
      helpSauces: "Add or remove sauces to taste — each portion adds a fee.",
      helpToppings: "Add or remove toppings — each portion adds a fee.",
      helpCrisps: "Add or remove crisps — each portion adds a fee.",
      helpDrinks: "Cool drinks — priced separately (optional).",
    },
  },
};
