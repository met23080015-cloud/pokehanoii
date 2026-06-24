import { describe, it, expect } from "vitest";
import { extractPayCode, isValidSePayPayload } from "@/lib/payment/sepay";

describe("lib/payment/sepay — extractPayCode", () => {
  it("trích mã từ nội dung sạch", () => {
    expect(extractPayCode("PKHA1B2C3D4")).toBe("PKHA1B2C3D4");
  });

  it("trích mã khi bank chèn tiền tố/nhiễu", () => {
    expect(extractPayCode("CT DEN:0123 PKHA1B2C3D4 GD 123")).toBe("PKHA1B2C3D4");
  });

  it("chuẩn hoá khi nội dung viết thường + có dấu cách/ký tự lạ", () => {
    expect(extractPayCode("pkh a1b2c3d4")).toBe("PKHA1B2C3D4");
    expect(extractPayCode("Thanh toan don PKH-A1B2C3D4.")).toBe("PKHA1B2C3D4");
  });

  it("lấy đúng 8 hex đầu khi có ký tự thừa phía sau", () => {
    expect(extractPayCode("PKHA1B2C3D4FF")).toBe("PKHA1B2C3D4");
  });

  it("trả null khi không có mã hợp lệ", () => {
    expect(extractPayCode("chuyen tien an trua")).toBeNull();
    expect(extractPayCode("PKH123")).toBeNull(); // thiếu độ dài
    expect(extractPayCode("PKHGGGGGGGG")).toBeNull(); // không phải hex
    expect(extractPayCode("")).toBeNull();
    expect(extractPayCode(null)).toBeNull();
    expect(extractPayCode(undefined)).toBeNull();
  });
});

describe("lib/payment/sepay — isValidSePayPayload", () => {
  const base = {
    id: 92704,
    transferType: "in" as const,
    transferAmount: 198000,
    content: "PKHA1B2C3D4",
    referenceCode: "MBVCB.123",
  };

  it("chấp nhận payload hợp lệ", () => {
    expect(isValidSePayPayload(base)).toBe(true);
  });

  it("từ chối khi thiếu id hoặc số tiền <= 0", () => {
    expect(isValidSePayPayload({ ...base, id: undefined })).toBe(false);
    expect(isValidSePayPayload({ ...base, transferAmount: 0 })).toBe(false);
  });

  it("từ chối transferType lạ và non-object", () => {
    expect(isValidSePayPayload({ ...base, transferType: "x" })).toBe(false);
    expect(isValidSePayPayload(null)).toBe(false);
    expect(isValidSePayPayload("abc")).toBe(false);
  });
});
