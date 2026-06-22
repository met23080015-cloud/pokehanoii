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
      sizeHint: "Giá cơ bản đã gồm 1 phần đạm.",
      sizeRegularTitle: "Bát vừa (Regular)",
      sizeRegularDesc: "Khẩu phần tiêu chuẩn",
      sizeExtraTitle: "Bát Extra Poke",
      sizeExtraDesc: "Thêm 1 phần đạm",
      // ItemCard
      itemProtein: "{n}g đạm",
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
      helpBases: "Chọn 1 lớp nền.",
      helpProteins: "Thêm số muỗng đạm (phần đầu đã gồm trong giá).",
      helpMixins: "Đồ trộn kèm (tùy chọn).",
      helpSauces: "Chọn 1 loại sốt.",
      helpToppings: "Chọn rau củ ăn kèm.",
      helpCrisps: "Rắc thêm đồ giòn.",
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
      helpBases: "Pick 1 base.",
      helpProteins: "Add protein scoops (the first is included in price).",
      helpMixins: "Mix-ins (optional).",
      helpSauces: "Pick 1 sauce.",
      helpToppings: "Choose your toppings.",
      helpCrisps: "Add some crunch.",
      helpDrinks: "Cool drinks — priced separately (optional).",
    },
  },
};
