import type { Slice } from "./index";

/** Bước xác nhận + thanh toán (Checkout, CheckoutSummary, PaymentChoice, VietQR).
 *  Namespace "checkout". Agent điền thêm khi convert các component checkout. */
export const checkout: Slice = {
  vi: {
    checkout: {
      payMethod: "Phương thức thanh toán",
      payCounter: "Trả tại quầy",
      payCounterDesc: "Mang số đơn ra quầy thanh toán",
      payVietQR: "Chuyển khoản VietQR",
      payVietQRDesc: "Quét mã QR chuyển khoản ngay",
      // Checkout
      back: "← Quay lại chỉnh bát",
      addMore: "+ Thêm món khác",
      noBaseWarn: "Bát cần ít nhất 1 lớp nền — bấm “+ Thêm món khác” để chọn nền.",
      submit: "Gửi đơn tới quầy",
      submitting: "Đang gửi...",
      errSubmit: "Không gửi được đơn",
      errNetwork: "Lỗi kết nối, thử lại.",
      // CheckoutSummary
      yourBowl: "Bát của bạn",
      tapToEdit: "Chạm ± để chỉnh",
      sizeExtra: "🔥 Bát Extra Poke (thêm phần đạm)",
      sizeRegular: "Bát vừa (Regular)",
      removeItem: "Bỏ món",
      decrease: "Bớt",
      increase: "Thêm",
      emptyBowl: "Chưa có món nào — quay lại chọn món nhé.",
      macroProtein: "đạm",
      macroFat: "béo",
      macroFiber: "xơ",
      total: "Tổng cộng",
      // VietQR
      vietqrNotConfigured:
        "Chưa cấu hình tài khoản VietQR (NEXT_PUBLIC_VIETQR_*). Vui lòng trả tại quầy.",
      vietqrAmount: "Số tiền",
      vietqrInfo: "Nội dung",
    },
  },
  en: {
    checkout: {
      payMethod: "Payment method",
      payCounter: "Pay at counter",
      payCounterDesc: "Bring your order number to the counter",
      payVietQR: "VietQR transfer",
      payVietQRDesc: "Scan the QR code to pay now",
      // Checkout
      back: "← Back to edit bowl",
      addMore: "+ Add more items",
      noBaseWarn: "Your bowl needs at least 1 base — tap “+ Add more items” to pick one.",
      submit: "Send order to counter",
      submitting: "Sending...",
      errSubmit: "Could not send order",
      errNetwork: "Connection error, please try again.",
      // CheckoutSummary
      yourBowl: "Your bowl",
      tapToEdit: "Tap ± to adjust",
      sizeExtra: "🔥 Extra Poke bowl (extra protein)",
      sizeRegular: "Regular bowl",
      removeItem: "Remove item",
      decrease: "Decrease",
      increase: "Increase",
      emptyBowl: "No items yet — go back and pick some.",
      macroProtein: "protein",
      macroFat: "fat",
      macroFiber: "fiber",
      total: "Total",
      // VietQR
      vietqrNotConfigured:
        "VietQR account not configured (NEXT_PUBLIC_VIETQR_*). Please pay at the counter.",
      vietqrAmount: "Amount",
      vietqrInfo: "Note",
    },
  },
};
