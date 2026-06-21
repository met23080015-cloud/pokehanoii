import { groups, GROUP_LABELS, getItem, thresholds, type GroupKey } from "@/lib/menu";
import type { Selection, Totals } from "@/lib/nutrition";
import type { Analytics } from "@/lib/analytics";
import { formatVND } from "@/lib/nutrition";

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
  return [
    `Bowl hiện tại: ${list}.`,
    `Tổng (do hệ thống tính, CHÍNH XÁC): ${t.kcal} kcal, đạm ${t.protein}g, béo ${t.fat}g, xơ ${t.fiber}g.`,
    `Mục tiêu calo: ${bowl.target} kcal (còn ${bowl.target - t.kcal} kcal).`,
    `Ngưỡng cân bằng tham chiếu: đạm ${thresholds.proteinMin}-${thresholds.proteinMax}g, xơ ≥${thresholds.fiberMin}g, béo ≤${thresholds.fatMax}g.`,
  ].join("\n");
}

export function buildSystemPrompt(bowl: BowlContext): string {
  return `Bạn là trợ lý tư vấn dinh dưỡng thân thiện của quán Poke Hanoi. Trả lời NGẮN GỌN bằng tiếng Việt.

NHIỆM VỤ: giúp khách tự build poke bowl cân bằng theo mục tiêu calo. Gợi ý món nên thêm/bớt, giải thích thiếu/dư chất gì.

QUY TẮC BẮT BUỘC:
- CHỈ dùng số liệu dinh dưỡng được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG tự bịa con số calo/đạm/béo/xơ.
- CHỈ gợi ý món có trong menu dưới đây. KHÔNG tự thêm món thay khách — khách sẽ tự bấm chọn.
- Khi nhắc tới món, LUÔN dùng TÊN TIẾNG VIỆT (ví dụ "Bạch tuộc", "Cá ngừ"). TUYỆT ĐỐI KHÔNG hiển thị id kỹ thuật (ví dụ "poke-octopus").
- IN ĐẬM bằng cách đặt **...** quanh các ĐIỂM QUAN TRỌNG: tên món được gợi ý và số liệu chính (calo, gram đạm). Ví dụ: "Thêm **Cá ngừ** (**12g đạm**)". Chỉ in đậm điểm nhấn, đừng in đậm cả câu.
- KHÔNG dùng loại markdown nào khác: không tiêu đề (#), không bảng, không dấu backtick. Nếu liệt kê thì dùng "- " hoặc "1. " đơn giản.
- Ngắn gọn, đi thẳng vấn đề, giọng thân thiện.

=== MENU & DINH DƯỠNG (mỗi đơn vị muỗng/phần) ===
${buildMenuContext()}

=== TRẠNG THÁI BOWL CỦA KHÁCH ===
${describeBowl(bowl)}`;
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

export function buildAnalyzePrompt(bowl: BowlContext): string {
  return `Phân tích độ cân bằng dinh dưỡng của bowl dưới đây và gợi ý tối đa 4 món NÊN THÊM (chỉ chọn từ menu, ưu tiên lấp chỗ thiếu xơ/đạm/rau xanh, tránh vượt calo mục tiêu nhiều).

${describeBowl(bowl)}

=== MENU CHỌN ĐƯỢC ===
${buildMenuContext()}

Chỉ dùng số liệu trên, không bịa. Trả về đúng cấu trúc yêu cầu.`;
}
