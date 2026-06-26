import type { Slice } from "./index";

/** Toàn bộ khu admin (Nav, Dashboard, Kitchen, Menu, Analytics, Inventory,
 *  ServiceRequests, OrderCard, AiInsight, Export, PriceConfig, Auth gates +
 *  các trang app/admin/*). Namespace "admin". */
export const admin: Slice = {
  vi: {
    admin: {
      // Nav
      navOrders: "Đơn hàng",
      navKitchen: "Bếp",
      navMenu: "Thực đơn",
      navInventory: "Tồn kho",
      navAnalytics: "Thống kê",
      navQr: "Mã QR",

      // Page titles
      titleOrders: "Poke Hanoi · Quản lý đơn",
      titleKitchen: "Poke Hanoi · Bếp",
      titleMenu: "Poke Hanoi · Thực đơn",
      titleInventory: "Poke Hanoi · Tồn kho",
      titleAnalytics: "Poke Hanoi · Thống kê",

      // Chung
      takeaway: "Mang đi",
      guest: "Khách",
      loadingData: "Đang tải số liệu…",
      noOrders: "Chưa có đơn nào.",
      supabaseMissing: "Supabase chưa cấu hình.",
      supabaseMissingFull:
        "Supabase chưa cấu hình (thiếu NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).",
      updateFailed:
        "Cập nhật thất bại — phiên đăng nhập có thể đã hết hạn. Hãy đăng xuất và đăng nhập lại.",
      updateFailedShort: "Cập nhật thất bại — phiên đăng nhập có thể đã hết hạn.",

      // Dashboard
      ordersProcessing: "{count} đơn đang xử lý",
      loadingShort: "Đang tải…",
      realtimeSuffix: "cập nhật realtime",

      // Kitchen
      ordersWaiting: "{count} đơn đang chờ",
      newOrderBell: "chuông khi có đơn mới",
      take: "Nhận làm",
      kitchenDone: "Xong ✓",

      // OrderCard
      statusPending: "Chờ nhận",
      statusAccepted: "Đang làm",
      statusDone: "Xong",
      payVietQR: "VietQR",
      payCounter: "Tại quầy",
      paid: "✓ Đã thanh toán",
      unpaid: "Chưa thanh toán",
      confirmPaid: "Xác nhận đã trả",
      accept: "Nhận đơn",
      complete: "Hoàn thành",

      // Service requests
      svcService: "🙋 Gọi phục vụ",
      svcBill: "🧾 Xin thanh toán",
      svcFeedback: "💬 Góp ý",
      svcCount: "🔔 {count} yêu cầu từ bàn",
      svcResolved: "Đã xử lý",

      // Notification bell
      notifTitle: "Thông báo",
      notifEmpty: "Chưa có yêu cầu nào.",
      justNow: "vừa xong",
      minAgo: "{n} phút trước",
      hourAgo: "{n} giờ trước",

      // Bảng yêu cầu tại bàn (panel trên dashboard)
      reqPanelTitle: "Yêu cầu tại bàn",
      reqPanelHide: "Thu gọn",
      reqPanelShow: "Mở rộng",

      // Menu manager
      menuHint:
        "Tắt món tạm hết hàng — món đó sẽ ẩn khỏi màn chọn món của khách <b>ngay lập tức</b>.",
      itemOut: "Hết",
      itemIn: "Còn",

      // Price config
      priceTitle: "Giá bán",
      priceBaseLabel: "Giá cơ bản / bát (đ)",
      priceExtraLabel: "Phụ phí mỗi muỗng đạm thêm (đ)",
      priceBaseFeeLabel: "Phụ phí mỗi lớp nền thêm (đ)",
      priceTopFeeLabel: "Phụ phí mỗi phần topping/đồ trộn/sốt (đ)",
      priceSave: "Lưu giá",
      priceSaving: "Đang lưu…",
      priceSaved: "✓ Đã lưu",
      priceNote: "Giá mới áp dụng ngay cho khách, cập nhật realtime.",
      priceCurrent: " Hiện tại: {price}/bát.",
      saveFailed: "Lưu thất bại — phiên đăng nhập có thể đã hết hạn.",

      // Analytics
      noOrdersStats: "Chưa có đơn nào để thống kê.",
      kpiRevenue: "Doanh thu đã thu",
      kpiOrdersPaid: "Đơn / đã trả",
      kpiAvgOrder: "Giá trị TB/đơn",
      kpiAvgKcal: "Calo TB/đơn",
      kpiAvgKcalValue: "{kcal} kcal",
      cardTopItems: "Món bán chạy",
      cardRevenueByDay: "Doanh thu theo ngày",
      cardPayPeak: "Thanh toán & giờ cao điểm",
      payMixLine: "Tại quầy <b>{counter}</b> · VietQR <b>{vietqr}</b>",
      hourTitle: "{hour}h: {count} đơn",

      // AI insight
      aiTitle: "🤖 Nhận định AI",
      aiAnalyzing: "Đang phân tích…",
      aiReanalyze: "Phân tích lại",
      aiGenerate: "Tạo nhận định",
      aiError: "Lỗi tạo insight",
      aiErrorShort: "Lỗi",

      // Export
      exportBusy: "Đang xuất…",
      exportCsv: "⬇ Xuất CSV",
      exportFailed: "Tải thất bại",
      exportFailedAlert: "Xuất CSV thất bại — thử lại nhé.",

      // Inventory
      invHint:
        "Hạn mức theo thứ cho từng nguyên liệu. Hôm nay là <b>{today}</b>. \"Còn lại\" cập nhật realtime theo từng đơn. Khi hết, mọi món dùng nguyên liệu này sẽ tự ẩn khỏi màn chọn món của khách.",
      invColIngredient: "Nguyên liệu",
      invColToday: "Còn hôm nay",
      invRefill: "Nạp lại",
      invSaveFailed: "Lưu thất bại — phiên đăng nhập có thể đã hết hạn.",
      invRefillFailed: "Nạp lại thất bại.",
      wdSun: "CN",
      wdMon: "T2",
      wdTue: "T3",
      wdWed: "T4",
      wdThu: "T5",
      wdFri: "T6",
      wdSat: "T7",

      // Auth gates
      checkingLogin: "Đang kiểm tra đăng nhập…",
      notStaff: "Tài khoản <b>{email}</b> chưa được cấp quyền nhân viên.",
      signOut: "Đăng xuất",
      gateHint: "Đăng nhập nhân viên để quản lý đơn.",
      gateEmail: "Email",
      gatePassword: "Mật khẩu",
      gateError: "Sai email hoặc mật khẩu",
      gateLoggingIn: "Đang vào…",
      gateLogin: "Đăng nhập",
      gateEnvMissing: "Supabase chưa cấu hình (thiếu env).",

      // QR page
      qrTitle: "Mã QR theo bàn",
      qrHint:
        "Mỗi mã trỏ tới trang order kèm số bàn ({code}). In ra và dán lên bàn. Quét bằng camera điện thoại để kiểm tra.",
      qrGenerating: "Đang tạo mã…",
      qrTableAlt: "QR bàn {table}",
      qrTableLabel: "Bàn {table}",
      qrOpenImage: "Tải / mở ảnh",
    },
  },
  en: {
    admin: {
      // Nav
      navOrders: "Orders",
      navKitchen: "Kitchen",
      navMenu: "Menu",
      navInventory: "Inventory",
      navAnalytics: "Analytics",
      navQr: "QR codes",

      // Page titles
      titleOrders: "Poke Hanoi · Orders",
      titleKitchen: "Poke Hanoi · Kitchen",
      titleMenu: "Poke Hanoi · Menu",
      titleInventory: "Poke Hanoi · Inventory",
      titleAnalytics: "Poke Hanoi · Analytics",

      // Chung
      takeaway: "Takeaway",
      guest: "Guest",
      loadingData: "Loading data…",
      noOrders: "No orders yet.",
      supabaseMissing: "Supabase not configured.",
      supabaseMissingFull:
        "Supabase not configured (missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).",
      updateFailed:
        "Update failed — your session may have expired. Please sign out and sign in again.",
      updateFailedShort: "Update failed — your session may have expired.",

      // Dashboard
      ordersProcessing: "{count} orders in progress",
      loadingShort: "Loading…",
      realtimeSuffix: "realtime updates",

      // Kitchen
      ordersWaiting: "{count} orders waiting",
      newOrderBell: "bell on new order",
      take: "Start",
      kitchenDone: "Done ✓",

      // OrderCard
      statusPending: "Pending",
      statusAccepted: "In progress",
      statusDone: "Done",
      payVietQR: "VietQR",
      payCounter: "Counter",
      paid: "✓ Paid",
      unpaid: "Unpaid",
      confirmPaid: "Mark as paid",
      accept: "Accept",
      complete: "Complete",

      // Service requests
      svcService: "🙋 Call staff",
      svcBill: "🧾 Request bill",
      svcFeedback: "💬 Feedback",
      svcCount: "🔔 {count} requests from tables",
      svcResolved: "Resolved",

      // Notification bell
      notifTitle: "Notifications",
      notifEmpty: "No requests yet.",
      justNow: "just now",
      minAgo: "{n} min ago",
      hourAgo: "{n} h ago",

      // Table-request panel (on dashboard)
      reqPanelTitle: "Table requests",
      reqPanelHide: "Collapse",
      reqPanelShow: "Expand",

      // Menu manager
      menuHint:
        "Turn off sold-out items — they disappear from the customer builder <b>instantly</b>.",
      itemOut: "Out",
      itemIn: "In",

      // Price config
      priceTitle: "Pricing",
      priceBaseLabel: "Base price / bowl (₫)",
      priceExtraLabel: "Surcharge per extra protein scoop (₫)",
      priceBaseFeeLabel: "Surcharge per extra base (₫)",
      priceTopFeeLabel: "Surcharge per topping/mix-in/sauce (₫)",
      priceSave: "Save price",
      priceSaving: "Saving…",
      priceSaved: "✓ Saved",
      priceNote: "Price changes apply instantly to the customer builder (realtime).",
      priceCurrent: " Current: {price}/bowl.",
      saveFailed: "Save failed — your session may have expired.",

      // Analytics
      noOrdersStats: "No orders to analyze yet.",
      kpiRevenue: "Revenue collected",
      kpiOrdersPaid: "Orders / paid",
      kpiAvgOrder: "Avg value/order",
      kpiAvgKcal: "Avg kcal/order",
      kpiAvgKcalValue: "{kcal} kcal",
      cardTopItems: "Top items",
      cardRevenueByDay: "Revenue by day",
      cardPayPeak: "Payment & peak hours",
      payMixLine: "Counter <b>{counter}</b> · VietQR <b>{vietqr}</b>",
      hourTitle: "{hour}h: {count} orders",

      // AI insight
      aiTitle: "🤖 AI insight",
      aiAnalyzing: "Analyzing…",
      aiReanalyze: "Re-analyze",
      aiGenerate: "Generate insight",
      aiError: "Failed to generate insight",
      aiErrorShort: "Error",

      // Export
      exportBusy: "Exporting…",
      exportCsv: "⬇ Export CSV",
      exportFailed: "Download failed",
      exportFailedAlert: "CSV export failed — please try again.",

      // Inventory
      invHint:
        "Daily quota per ingredient by weekday. Today is <b>{today}</b>. \"Remaining\" updates in realtime with orders. When out → every item using it auto-hides in the builder.",
      invColIngredient: "Ingredient",
      invColToday: "Left today",
      invRefill: "Refill",
      invSaveFailed: "Save failed — your session may have expired.",
      invRefillFailed: "Refill failed.",
      wdSun: "Sun",
      wdMon: "Mon",
      wdTue: "Tue",
      wdWed: "Wed",
      wdThu: "Thu",
      wdFri: "Fri",
      wdSat: "Sat",

      // Auth gates
      checkingLogin: "Checking sign-in…",
      notStaff: "Account <b>{email}</b> has not been granted staff access.",
      signOut: "Sign out",
      gateHint: "Staff sign-in to manage orders.",
      gateEmail: "Email",
      gatePassword: "Password",
      gateError: "Wrong email or password",
      gateLoggingIn: "Signing in…",
      gateLogin: "Sign in",
      gateEnvMissing: "Supabase not configured (missing env).",

      // QR page
      qrTitle: "Table QR codes",
      qrHint:
        "Each code points to the order page with a table number ({code}). Print and stick on the table. Scan with a phone camera to test.",
      qrGenerating: "Generating codes…",
      qrTableAlt: "QR table {table}",
      qrTableLabel: "Table {table}",
      qrOpenImage: "Download / open image",
    },
  },
};
