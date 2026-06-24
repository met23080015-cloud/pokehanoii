import type { Slice } from "./index";

/** Theo dõi đơn + xác nhận đơn (OrderTracker, OrderConfirmation). Namespace "order". */
export const order: Slice = {
  vi: {
    order: {
      // OrderConfirmation
      sent: "Đã gửi đơn tới quầy!",
      yourOrderCode: "Mã đơn của bạn",
      table: "Bàn",
      noteVietQR: "Đơn tự xác nhận ngay khi nhận được chuyển khoản. Bạn có thể theo dõi trạng thái bên dưới.",
      noteCounter: "Vui lòng ra quầy thanh toán khi nhận món.",
      track: "Theo dõi đơn",
      newOrder: "Đặt bát mới",
      // OrderTracker
      loading: "Đang tải đơn…",
      notFound: "Không tìm thấy đơn này.",
      stepSentLabel: "Đã gửi",
      stepSentDesc: "Đơn đã tới quầy",
      stepMakingLabel: "Đang làm",
      stepMakingDesc: "Bếp đang chuẩn bị",
      stepDoneLabel: "Hoàn thành",
      stepDoneDesc: "Mời bạn nhận món",
      orderCode: "Mã đơn",
      orderedItems: "Món đã đặt",
      total: "Tổng",
      payVietQR: "Chuyển khoản VietQR",
      payCounter: "Trả tại quầy",
      paid: "✓ Đã thanh toán",
      unpaid: "Chưa thanh toán",
      autoRefresh: "Trang tự cập nhật mỗi vài giây.",
    },
  },
  en: {
    order: {
      // OrderConfirmation
      sent: "Order sent to the counter!",
      yourOrderCode: "Your order code",
      table: "Table",
      noteVietQR: "Your order confirms automatically once we receive the transfer. You can track its status below.",
      noteCounter: "Please pay at the counter when you receive your food.",
      track: "Track order",
      newOrder: "New bowl",
      // OrderTracker
      loading: "Loading order…",
      notFound: "Order not found.",
      stepSentLabel: "Sent",
      stepSentDesc: "Order reached the counter",
      stepMakingLabel: "Preparing",
      stepMakingDesc: "Kitchen is preparing it",
      stepDoneLabel: "Ready",
      stepDoneDesc: "Please pick up your food",
      orderCode: "Order code",
      orderedItems: "Ordered items",
      total: "Total",
      payVietQR: "VietQR transfer",
      payCounter: "Pay at counter",
      paid: "✓ Paid",
      unpaid: "Unpaid",
      autoRefresh: "This page refreshes every few seconds.",
    },
  },
};
