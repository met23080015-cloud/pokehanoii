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
      scanGateTitle: "Quét mã QR tại bàn",
      scanGateBody:
        "Quét mã QR dán trên bàn để bắt đầu gọi món. Mỗi bàn có một mã riêng, giúp nhân viên mang món đến đúng chỗ.",
      loginEarn: "Đăng nhập để tích điểm",
      cta: "Xem thực đơn – Gọi món →",
      thanks: "Cảm ơn bạn đã ghé Poke Hanoi 💚",
      subtitle: "Tự tay làm bát theo mục tiêu calo của bạn",
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
      scanGateTitle: "Scan the QR at your table",
      scanGateBody:
        "Please scan the QR code on your table to start ordering. Each table has its own code so staff can serve you at the right spot.",
      loginEarn: "Sign in to earn points",
      cta: "View menu – Order now →",
      thanks: "Thanks for visiting Poke Hanoi 💚",
      subtitle: "Build your bowl by calorie goal",
    },
  },
};
