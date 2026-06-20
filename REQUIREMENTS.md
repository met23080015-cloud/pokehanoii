# REQUIREMENTS — Cần chuẩn bị / điền trước khi build đầy đủ

Checklist mọi thứ **bạn cần cung cấp** để app chạy thật. Đánh dấu `[x]` khi xong.

---

## 1. Tài khoản & API keys → điền vào `.env.local`

| Biến | Lấy ở đâu | Dùng cho | Bắt buộc |
|------|-----------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | DB + realtime | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | DB + realtime | ✅ |
| `OPENAI_API_KEY` | platform.openai.com/api-keys | AI tư vấn (gpt-4o-mini) | ✅ |
| `ADMIN_PASSWORD` | Tự đặt | Đăng nhập /admin | ✅ |
| `NEXT_PUBLIC_VIETQR_BANK` | Mã NH (VCB/MB/TCB...) | QR thanh toán | ⚠️ nếu dùng VietQR |
| `NEXT_PUBLIC_VIETQR_ACCOUNT` | Số TK quán | QR thanh toán | ⚠️ |
| `NEXT_PUBLIC_VIETQR_NAME` | Tên chủ TK | QR thanh toán | ⚠️ |
| `NEXT_PUBLIC_TABLE_COUNT` | Số bàn của quán | Sinh QR per-bàn | ✅ (mặc định 10) |

- [ ] Tạo **Supabase project** (free) → copy URL + anon key
- [ ] Tạo **OpenAI key** (gpt-4o-mini rất rẻ) + nạp ít credit
- [ ] Chọn **ADMIN_PASSWORD**
- [ ] Thông tin **tài khoản ngân hàng** quán cho VietQR (hoặc dùng TK test)
- [ ] Số **bàn thật** của quán
- [ ] `cp .env.example .env.local` rồi điền hết

---

## 2. Dữ liệu dinh dưỡng món → điền vào `data/menu.json`

File `data/menu.json` đã liệt kê **đầy đủ tất cả món** từ menu quán (base, poke, sauce, topping, crisp). Mỗi món cần điền **cho 1 đơn vị (muỗng/phần)**:

- `grams` — khối lượng 1 muỗng/phần (gram)
- `kcal` — calo
- `protein` — đạm (g)
- `fat` — chất béo (g)
- `fiber` — chất xơ (g)

> Hiện đang để `null` (app tạm tính = 0). **Đây là task content lớn nhất** — nên làm sớm, song song với code.

**Cách lấy số liệu (ước tính chấp nhận được cho prototype):**
- [ ] Tra bảng dinh dưỡng chuẩn (USDA FoodData / Viện Dinh dưỡng VN) theo gram
- [ ] Hỏi quán khối lượng 1 muỗng đạm / 1 phần base (cân thử nếu được)
- [ ] Ghi rõ trong app + báo cáo là **"số liệu ước tính"**

**Cần CHỐT thêm:**
- [ ] **Mô hình giá**: hiện giả định Regular = **198k** (gồm base + 1 phần đạm + topping thường), mỗi phần đạm thêm **+48k**, topping premium (Tobiko/Guacamole) **+20k**. Đúng không? Có giới hạn số topping/crisp miễn phí không?
- [ ] **Ngưỡng cân bằng** (`thresholds` trong menu.json) cho AI review: protein 25–45g, fiber ≥8g, fat ≤30g — chốt lại theo ý quán/dinh dưỡng.

---

## 3. GitHub & Vercel (nộp bài)

- [ ] Tạo **GitHub repo PUBLIC**, tên có **nhóm 9** (vd `nhom-9-pokehanoi`)
- [ ] Import vào **Vercel**, project name có **nhóm 9**
- [ ] Set toàn bộ env vars (mục 1) trên Vercel → Project Settings → Environment Variables
- [ ] Lấy 2 link: GitHub + Vercel live URL → điền vào `README.md`

---

## 4. Đã có sẵn (không cần làm)

- [x] Scaffold Next.js 15 + TS + Tailwind
- [x] Cấu trúc thư mục + config
- [x] Template `menu.json` đầy đủ danh sách món
- [x] `.env.example`
- [x] Hook tự lưu prompt journey → `docs/vibe-coding-journey.json` *(cần `/hooks` reload hoặc restart để kích hoạt)*
- [x] Kế hoạch 7 phase: `plans/20260620-pokehanoi-calo-order-app/`

---

## Ưu tiên làm ngay (để không kẹt sau)
1. **Supabase project + OpenAI key** (chặn Phase 02/06)
2. **Dữ liệu dinh dưỡng** menu.json (chặn giá trị thật của Phase 03)
3. **Chốt mô hình giá** (chặn Phase 04)
