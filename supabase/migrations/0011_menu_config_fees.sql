-- Poke Hanoi — Mở rộng cấu hình giá: phụ phí mỗi lớp nền thêm + mỗi phần topping/đồ trộn/sốt/giòn.
-- Đi kèm đổi mô hình giá: KHÁCH có thể thêm/bớt MỌI món, mỗi phần thêm đều tính tiền.
-- Chạy trong Supabase → SQL Editor (sau 0010). Seed = giá mặc định trong data/menu.json.

alter table menu_config
  add column if not exists extra_base_fee int not null default 25000,
  add column if not exists extra_topping_fee int not null default 10000;

-- Đảm bảo dòng cấu hình (id=1) có giá trị (phòng khi đã tồn tại trước khi thêm cột).
update menu_config
  set extra_base_fee = coalesce(extra_base_fee, 25000),
      extra_topping_fee = coalesce(extra_topping_fee, 10000)
  where id = 1;

notify pgrst, 'reload schema';
