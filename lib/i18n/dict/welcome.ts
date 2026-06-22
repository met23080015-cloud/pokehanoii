import type { Slice } from "./index";

/** Màn hình chào (WelcomeScreen). Namespace "welcome". */
export const welcome: Slice = {
  vi: {
    welcome: {
      greetMorning: "Chào buổi sáng",
      greetLunch: "Chúc bạn ngon miệng",
      greetAfternoon: "Chào buổi chiều",
      greetEvening: "Chào buổi tối",
      greetDefault: "Xin chào",
      menuLabel: "Thực đơn điện tử",
      heroTitle: "Poke bowl\ntheo mục tiêu calo",
      servedAt: "Món sẽ được phục vụ tại",
      askTable: "Bạn đang ngồi bàn số mấy? Nhập để nhân viên phục vụ đúng chỗ:",
      tablePlaceholder: "Bàn 1–{max}",
      tableError: "Quán chỉ có bàn 1–{max}. Vui lòng kiểm tra lại.",
      orLater: "Hoặc xem thực đơn trước, chọn bàn sau cũng được.",
      loginEarn: "Đăng nhập để tích điểm",
      cta: "Xem thực đơn – Gọi món →",
      thanks: "Cảm ơn bạn đã ghé Poke Hanoi 💚",
      subtitle: "Tự build bát theo mục tiêu calo",
    },
  },
  en: {
    welcome: {
      greetMorning: "Good morning",
      greetLunch: "Enjoy your meal",
      greetAfternoon: "Good afternoon",
      greetEvening: "Good evening",
      greetDefault: "Hello",
      menuLabel: "Digital menu",
      heroTitle: "Poke bowls\nby calorie goal",
      servedAt: "Your order will be served at",
      askTable: "Which table are you at? Enter it so staff can serve the right spot:",
      tablePlaceholder: "Table 1–{max}",
      tableError: "We only have tables 1–{max}. Please check again.",
      orLater: "Or browse the menu first and pick a table later.",
      loginEarn: "Sign in to earn points",
      cta: "View menu – Order now →",
      thanks: "Thanks for visiting Poke Hanoi 💚",
      subtitle: "Build your bowl by calorie goal",
    },
  },
};
