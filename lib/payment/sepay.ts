/**
 * SePay — tiện ích đối soát thanh toán QR.
 * Mã thanh toán đơn = PKH + 8 hex đầu của order id (xem migration 0009, generated column).
 * Banks viết HOA + bỏ dấu + có thể chèn ký tự lạ vào nội dung CK → chuẩn hoá rồi dò bằng regex.
 */

/** Định dạng mã: PKH + đúng 8 ký tự hex (chữ hoa). */
const PAY_CODE_RE = /PKH[0-9A-F]{8}/;

/**
 * Trích pay_code từ nội dung chuyển khoản SePay gửi về.
 * Chuẩn hoá: bỏ mọi ký tự không phải chữ/số rồi viết hoa, sau đó dò PKHxxxxxxxx.
 * @returns mã dạng "PKHA1B2C3D4" hoặc null nếu không tìm thấy.
 */
export function extractPayCode(content: string | null | undefined): string | null {
  if (!content) return null;
  const normalized = content.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const m = normalized.match(PAY_CODE_RE);
  return m ? m[0] : null;
}

/** Payload webhook SePay (các trường ta dùng). */
export interface SePayWebhookPayload {
  id: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string | null;
  transferType: "in" | "out";
  transferAmount: number;
  referenceCode?: string;
}

/** Kiểm tra tối thiểu payload để xử lý an toàn. */
export function isValidSePayPayload(p: unknown): p is SePayWebhookPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    (o.transferType === "in" || o.transferType === "out") &&
    typeof o.transferAmount === "number" &&
    o.transferAmount > 0
  );
}
