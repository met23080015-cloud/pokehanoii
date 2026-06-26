import { groups, GROUP_LABELS, getItem, thresholds, type GroupKey } from "@/lib/menu";
import type { BowlSize, Selection, Totals } from "@/lib/nutrition";
import type { Analytics } from "@/lib/analytics";
import { formatVND } from "@/lib/nutrition";
import { GUARDRAILS } from "@/lib/ai/guardrails";

/** Bối cảnh menu nén lại cho AI (tên + macro + id). AI chỉ dùng số này, không bịa. */
export function buildMenuContext(): string {
  return (Object.keys(groups) as GroupKey[])
    .map((g) => {
      const lines = groups[g]
        .map(
          (it) =>
            `  - ${it.id} | ${it.vi} (${it.en}): ${it.kcal ?? 0}kcal, đạm ${it.protein ?? 0}g, béo ${it.fat ?? 0}g, xơ ${it.fiber ?? 0}g`,
        )
        .join("\n");
      return `${GROUP_LABELS[g]}:\n${lines}`;
    })
    .join("\n\n");
}

export interface BowlContext {
  selection: Selection;
  totals: Totals;
  target: number;
  size?: BowlSize;
}

export function describeBowl(bowl: BowlContext): string {
  const items = Object.entries(bowl.selection)
    .filter(([, q]) => (q || 0) > 0)
    .map(([id, q]) => {
      const it = getItem(id);
      return `${it?.vi ?? id}${q > 1 ? ` x${q}` : ""}`;
    });
  const list = items.length ? items.join(", ") : "(chưa chọn món nào)";
  const t = bowl.totals;
  const sizeLine =
    bowl.size === "extra" ? "Cỡ bát: Extra Poke (thêm 1 phần đạm)." : "Cỡ bát: Vừa (Regular).";
  return [
    `Bowl hiện tại: ${list}.`,
    sizeLine,
    `Tổng (do hệ thống tính, CHÍNH XÁC): ${t.kcal} kcal, đạm ${t.protein}g, béo ${t.fat}g, xơ ${t.fiber}g.`,
    `Mục tiêu calo: ${bowl.target} kcal (còn ${bowl.target - t.kcal} kcal).`,
    `Ngưỡng cân bằng tham chiếu: đạm ${thresholds.proteinMin}-${thresholds.proteinMax}g, xơ ≥${thresholds.fiberMin}g, béo ≤${thresholds.fatMax}g.`,
  ].join("\n");
}

/** Đoạn cá nhân hóa từ lịch sử khách (nếu có) — chèn vào prompt. */
function profileBlock(profile?: string | null): string {
  return profile
    ? `\n\n=== KHẨU VỊ KHÁCH (cá nhân hóa, do hệ thống tổng hợp) ===\n${profile}\nKhi phù hợp, ưu tiên gợi ý hợp khẩu vị này và nhắc khéo "lần trước bạn hay chọn…". KHÔNG ép buộc.`
    : "";
}

/** Chỉ thị ngôn ngữ ở CUỐI prompt (nhấn mạnh recency) khi lang="en". */
function langDirective(lang: "vi" | "en"): string {
  return lang === "en"
    ? "\n\n=== LANGUAGE (CRITICAL) ===\nReply ENTIRELY in English — this overrides every Vietnamese instruction/example above. If a tool returns Vietnamese item names, use the ENGLISH names from the menu above instead. Keep all other rules."
    : "";
}

export function buildSystemPrompt(
  bowl: BowlContext,
  profile?: string | null,
  lang: "vi" | "en" = "vi",
): string {
  const en = lang === "en";
  return `${en ? "LANGUAGE: You MUST reply ENTIRELY in English. The Vietnamese text below is instructions/examples — follow them but WRITE YOUR ANSWER IN ENGLISH.\n\n" : ""}Bạn là trợ lý tư vấn dinh dưỡng thân thiện của quán Poke Hanoi. Trả lời NGẮN GỌN bằng ${en ? "tiếng Anh (English)" : "tiếng Việt"}.

${GUARDRAILS}

NHIỆM VỤ: giúp khách tự build poke bowl cân bằng theo mục tiêu calo. Gợi ý món nên thêm/bớt, giải thích thiếu/dư chất gì.

QUY TẮC BẮT BUỘC:
- CHỈ dùng số liệu dinh dưỡng được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG tự bịa con số calo/đạm/béo/xơ.
- CHỈ gợi ý món có trong menu dưới đây. KHÔNG tự thêm món thay khách — khách sẽ tự bấm chọn.
- Khi nhắc tới món, dùng ${en ? "TÊN TIẾNG ANH của món như ghi trong menu (phần trong ngoặc), ví dụ \"Octopus\", \"Tuna\"" : 'TÊN TIẾNG VIỆT (ví dụ "Bạch tuộc", "Cá ngừ")'}. TUYỆT ĐỐI KHÔNG hiển thị id kỹ thuật (ví dụ "poke-octopus").
- IN ĐẬM bằng cách đặt **...** quanh các ĐIỂM QUAN TRỌNG: tên món được gợi ý và số liệu chính (calo, gram đạm). Ví dụ: "Thêm **Cá ngừ** (**12g đạm**)". Chỉ in đậm điểm nhấn, đừng in đậm cả câu.
- KHÔNG dùng loại markdown nào khác: không tiêu đề (#), không bảng, không dấu backtick. Nếu liệt kê thì dùng "- " hoặc "1. " đơn giản.
- Ngắn gọn, đi thẳng vấn đề, giọng thân thiện.

TỐI ƯU THEO NGÂN SÁCH / CALO / ĐẠM (QUAN TRỌNG):
- Khi khách hỏi kiểu "với X tiền mà vẫn đủ Y calo / Z gram đạm thì ăn gì" (bài toán tối ưu có ràng buộc), BẮT BUỘC gọi công cụ suggestBowl với đúng các ràng buộc trích từ câu hỏi (budget = số tiền, kcalTarget = calo, proteinMin = đạm). TUYỆT ĐỐI KHÔNG tự nhẩm tổ hợp món hay tự cộng giá/calo — chỉ công cụ mới được tính.
- ĐƠN VỊ TIỀN: budget tính bằng VND. Quy đổi đúng: "120k" / "120 nghìn" / "120 ngàn" = 120000; "1 trăm rưởi" = 150000. KHÔNG truyền 120 khi khách nói "120k".
- Nếu khách thiếu ràng buộc rõ ràng (vd "rẻ mà nhiều đạm" nhưng không nói số tiền/đạm cụ thể), HỎI LẠI 1 câu ngắn để chốt con số trước khi gọi công cụ.
- Sau khi có kết quả: nếu feasible=true, trình bày bowl gợi ý — liệt kê tên món (kèm số lượng), cỡ bát, và in đậm tổng **calo**, **đạm**, **giá**. Nhắc khách tự bấm chọn các món đó.
- Nếu feasible=false, nói thẳng "với mức này chưa đạt", rồi:
  • Nếu có "goalMin" (bowl rẻ nhất đạt dinh dưỡng nhưng vượt ngân sách): nêu RÕ HAI con số — (1) TỔNG tối thiểu để đạt = goalMin.price; (2) phần CẦN THÊM so với ngân sách = goalMin.price − budget. Diễn đạt rành mạch, ví dụ "Cần tổng tối thiểu **294k** (tức thêm **174k** so với 120k của bạn)". Rồi liệt kê bowl goalMin. Hai số này lấy/trừ từ dữ liệu công cụ, KHÔNG tự nhẩm con số khác.
  • Nếu chỉ có "nearest" (không có goalMin): nghĩa là ngay cả không giới hạn tiền cũng không đạt chỉ tiêu (vd đạm quá cao so với menu) — nói rõ điều đó và đưa "nearest" làm phương án gần nhất.
  • TUYỆT ĐỐI KHÔNG bịa ra bowl hay con số ngoài dữ liệu công cụ trả về.

=== MENU & DINH DƯỠNG (mỗi đơn vị muỗng/phần) ===
${buildMenuContext()}

=== TRẠNG THÁI BOWL CỦA KHÁCH ===
${describeBowl(bowl)}${profileBlock(profile)}${langDirective(lang)}`;
}

/** Prompt insight kinh doanh cho admin — bơm số liệu thật, AI chỉ diễn giải. */
export function buildAdminInsightPrompt(a: Analytics): string {
  const s = a.summary;
  const top = a.topItems.slice(0, 6).map((i) => `${i.vi} (${i.qty})`).join(", ") || "—";
  const slow = a.slowItems.map((i) => `${i.vi} (${i.qty})`).join(", ") || "—";
  const peak = a.peakHours
    .map((c, h) => ({ h, c }))
    .filter((x) => x.c > 0)
    .sort((x, y) => y.c - x.c)
    .slice(0, 3)
    .map((x) => `${x.h}h (${x.c} đơn)`)
    .join(", ") || "—";

  return `Bạn là cố vấn kinh doanh cho quán Poke Hanoi. Dựa HOÀN TOÀN vào số liệu thật dưới đây, đưa nhận định và đề xuất NGẮN GỌN bằng tiếng Việt. TUYỆT ĐỐI KHÔNG bịa thêm con số ngoài dữ liệu.

=== SỐ LIỆU (do hệ thống tính) ===
- Tổng đơn: ${s.orderCount} | Đã thanh toán: ${s.paidCount} (${s.paidRate}%)
- Doanh thu đã thu: ${formatVND(s.revenue)} | Giá trị đơn TB: ${formatVND(s.avgOrderValue)}
- Calo trung bình/đơn: ${s.avgKcal} kcal
- Thanh toán: tại quầy ${a.payMix.counter} đơn, VietQR ${a.payMix.vietqr} đơn
- Món bán chạy: ${top}
- Món bán chậm: ${slow}
- Giờ cao điểm: ${peak}

Trả về đúng cấu trúc yêu cầu: headline, observations (3-4 quan sát), actions (tối đa 3 đề xuất). Đề xuất phải cụ thể, khả thi cho quán nhỏ.`;
}

export function buildAnalyzePrompt(
  bowl: BowlContext,
  profile?: string | null,
  lang: "vi" | "en" = "vi",
): string {
  const langNote =
    lang === "en"
      ? "\n\nNGÔN NGỮ: Viết summary và gaps HOÀN TOÀN bằng tiếng Anh (English)."
      : "";
  return `Phân tích độ cân bằng dinh dưỡng của bowl dưới đây và gợi ý tối đa 4 món NÊN THÊM (chỉ chọn từ menu, ưu tiên lấp chỗ thiếu xơ/đạm/rau xanh, tránh vượt calo mục tiêu nhiều).

${describeBowl(bowl)}${profileBlock(profile)}

=== MENU CHỌN ĐƯỢC ===
${buildMenuContext()}

Chỉ dùng số liệu trên, không bịa. Trả về đúng cấu trúc yêu cầu.${langNote}`;
}
