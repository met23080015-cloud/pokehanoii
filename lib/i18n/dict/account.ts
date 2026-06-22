import type { Slice } from "./index";

/** Trang tài khoản (AccountPanel, /account page). Namespace "account". */
export const account: Slice = {
  vi: {
    account: {
      pageTitle: "Tài khoản",
      loading: "Đang tải…",
      // Logged out / sign-in form
      loginPrompt:
        "Đăng nhập để tích điểm và xem lịch sử đơn. Khách vãng lai vẫn đặt món bình thường.",
      linkSentPrefix: "Đã gửi link đăng nhập tới",
      linkSentSuffix: ". Mở email và bấm vào link.",
      emailPlaceholder: "Email của bạn",
      sendLink: "Gửi link đăng nhập",
      errSendLink: "Không gửi được link — thử lại sau ít phút.",
      backToOrder: "← Về đặt món",
      // Logged in
      guest: "Khách",
      points: "điểm thưởng",
      signOut: "Đăng xuất",
      history: "Lịch sử đơn",
      noOrders: "Chưa có đơn nào.",
      paidShort: "đã trả",
      unpaidShort: "chưa trả",
      reorder: "Đặt lại",
    },
  },
  en: {
    account: {
      pageTitle: "Account",
      loading: "Loading…",
      // Logged out / sign-in form
      loginPrompt:
        "Sign in to earn points and view your order history. Guests can still order normally.",
      linkSentPrefix: "Sign-in link sent to",
      linkSentSuffix: ". Open the email and tap the link.",
      emailPlaceholder: "Your email",
      sendLink: "Send sign-in link",
      errSendLink: "Could not send the link — please try again in a few minutes.",
      backToOrder: "← Back to ordering",
      // Logged in
      guest: "Guest",
      points: "reward points",
      signOut: "Sign out",
      history: "Order history",
      noOrders: "No orders yet.",
      paidShort: "paid",
      unpaidShort: "unpaid",
      reorder: "Reorder",
    },
  },
};
