import type { Slice } from "./index";

/** Trợ lý AI phía khách (ChatWidget, ReviewCard). Namespace "ai". */
export const ai: Slice = {
  vi: {
    ai: {
      // ReviewCard
      reviewTitle: "AI phân tích dinh dưỡng",
      balanced: "Bát khá cân bằng 👍",
      suggestMore: "Gợi ý thêm",
      aiNotReady: "(AI chưa sẵn sàng — đang hiển thị phân tích cơ bản từ hệ thống.)",
      // ChatWidget
      fabLabel: "Tư vấn dinh dưỡng — kéo để di chuyển",
      chatTitle: "🤖 Tư vấn dinh dưỡng",
      close: "Đóng",
      welcome:
        'Chào bạn! Cứ hỏi mình cách làm bát cân bằng nhé — ví dụ: "1000 calo, nhiều đạm ít béo thì nên ăn gì?"',
      typing: "Đang soạn…",
      errChat: "Lỗi: AI chưa sẵn sàng (kiểm tra API key).",
      inputPlaceholder: "Nhập câu hỏi…",
      send: "Gửi",
    },
  },
  en: {
    ai: {
      // ReviewCard
      reviewTitle: "AI nutrition analysis",
      balanced: "Your bowl is well balanced 👍",
      suggestMore: "Suggestions",
      aiNotReady: "(AI not ready — showing the basic system analysis.)",
      // ChatWidget
      fabLabel: "Nutrition assistant — drag to move",
      chatTitle: "🤖 Nutrition assistant",
      close: "Close",
      welcome:
        'Hi! Ask me how to build a balanced bowl — e.g. "what should I eat for 1000 kcal, high protein, low fat?"',
      typing: "Typing…",
      errChat: "Error: AI not ready (check the API key).",
      inputPlaceholder: "Type your question…",
      send: "Send",
    },
  },
};
