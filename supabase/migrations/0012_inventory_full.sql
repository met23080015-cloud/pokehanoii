-- Poke Hanoi — Mở rộng tồn kho BOM cho TẤT CẢ nguyên liệu còn lại (đồ trộn, sốt, topping, đồ giòn).
-- Trước đây chỉ đạm/nền/đồ uống có công thức → các nhóm này coi như vô hạn. Nay mỗi món tự ánh xạ
-- 1–1 sang một nguyên liệu riêng (qty_per_unit = 1) để giới hạn theo tồn kho thực tế như mọi món khác.
-- Hạn mức mặc định 40 phần/ngày cho mọi thứ — admin chỉnh lại trong trang Tồn kho.
-- Chạy trong Supabase → SQL Editor (sau 0011). Idempotent (on conflict do nothing).

-- ───────────────────── 1) Nguyên liệu (mỗi món = 1 nguyên liệu 'ing-<id món>') ─────────────────────
insert into ingredient (id, name_vi, unit) values
  ('ing-mixin-cucumber', 'Dưa leo', 'phần'),
  ('ing-mixin-pickled-onion', 'Hành ngâm', 'phần'),
  ('ing-sauce-shoyu', 'Shoyu (nước tương)', 'phần'),
  ('ing-sauce-gomae', 'Sốt mè rang', 'phần'),
  ('ing-sauce-wasabi-mayo', 'Sốt mù tạt béo', 'phần'),
  ('ing-sauce-spicy-mayo', 'Sốt cay béo', 'phần'),
  ('ing-sauce-shiso-miso', 'Sốt miso lá tía tô', 'phần'),
  ('ing-top-tobiko', 'Trứng cá chuồn (Tobiko)', 'phần'),
  ('ing-top-guacamole', 'Bơ trộn (Guacamole)', 'phần'),
  ('ing-top-wakame', 'Rong biển', 'phần'),
  ('ing-top-crab-salad', 'Thanh cua', 'phần'),
  ('ing-top-edamame', 'Đậu Nhật', 'phần'),
  ('ing-top-mushroom', 'Nấm', 'phần'),
  ('ing-top-radish', 'Củ cải Nhật', 'phần'),
  ('ing-top-tomato', 'Cà chua', 'phần'),
  ('ing-top-pineapple', 'Dứa', 'phần'),
  ('ing-top-eggplant', 'Cà tím', 'phần'),
  ('ing-top-jalapeno', 'Ớt ngâm', 'phần'),
  ('ing-top-sauerkraut', 'Bắp cải ngâm', 'phần'),
  ('ing-top-quail-egg', 'Trứng cút', 'phần'),
  ('ing-top-mango', 'Xoài', 'phần'),
  ('ing-top-ginger', 'Gừng', 'phần'),
  ('ing-top-miso-corn', 'Bắp (Miso butter corn)', 'phần'),
  ('ing-top-spring-onion', 'Hành lá', 'phần'),
  ('ing-top-coriander', 'Rau mùi', 'phần'),
  ('ing-crisp-fried-shallot', 'Hành phi', 'phần'),
  ('ing-crisp-sesame', 'Vừng đen/trắng', 'phần'),
  ('ing-crisp-nori', 'Rong biển vụn', 'phần'),
  ('ing-crisp-furikake', 'Gia vị rắc cơm Nhật', 'phần'),
  ('ing-crisp-togarashi', 'Ớt bột', 'phần')
on conflict (id) do nothing;

-- ───────────────────── 2) Công thức (BOM 1–1) ─────────────────────
insert into recipe (item_id, ingredient_id, qty_per_unit) values
  ('mixin-cucumber', 'ing-mixin-cucumber', 1),
  ('mixin-pickled-onion', 'ing-mixin-pickled-onion', 1),
  ('sauce-shoyu', 'ing-sauce-shoyu', 1),
  ('sauce-gomae', 'ing-sauce-gomae', 1),
  ('sauce-wasabi-mayo', 'ing-sauce-wasabi-mayo', 1),
  ('sauce-spicy-mayo', 'ing-sauce-spicy-mayo', 1),
  ('sauce-shiso-miso', 'ing-sauce-shiso-miso', 1),
  ('top-tobiko', 'ing-top-tobiko', 1),
  ('top-guacamole', 'ing-top-guacamole', 1),
  ('top-wakame', 'ing-top-wakame', 1),
  ('top-crab-salad', 'ing-top-crab-salad', 1),
  ('top-edamame', 'ing-top-edamame', 1),
  ('top-mushroom', 'ing-top-mushroom', 1),
  ('top-radish', 'ing-top-radish', 1),
  ('top-tomato', 'ing-top-tomato', 1),
  ('top-pineapple', 'ing-top-pineapple', 1),
  ('top-eggplant', 'ing-top-eggplant', 1),
  ('top-jalapeno', 'ing-top-jalapeno', 1),
  ('top-sauerkraut', 'ing-top-sauerkraut', 1),
  ('top-quail-egg', 'ing-top-quail-egg', 1),
  ('top-mango', 'ing-top-mango', 1),
  ('top-ginger', 'ing-top-ginger', 1),
  ('top-miso-corn', 'ing-top-miso-corn', 1),
  ('top-spring-onion', 'ing-top-spring-onion', 1),
  ('top-coriander', 'ing-top-coriander', 1),
  ('crisp-fried-shallot', 'ing-crisp-fried-shallot', 1),
  ('crisp-sesame', 'ing-crisp-sesame', 1),
  ('crisp-nori', 'ing-crisp-nori', 1),
  ('crisp-furikake', 'ing-crisp-furikake', 1),
  ('crisp-togarashi', 'ing-crisp-togarashi', 1)
on conflict (item_id, ingredient_id) do nothing;

-- ───────────────────── 3) Hạn mức mặc định 40/ngày cho cả tuần ─────────────────────
insert into ingredient_quota (ingredient_id, weekday, quota_amount)
select i.id, d.wd, 40
from (values
  ('ing-mixin-cucumber'), ('ing-mixin-pickled-onion'), ('ing-sauce-shoyu'), ('ing-sauce-gomae'),
  ('ing-sauce-wasabi-mayo'), ('ing-sauce-spicy-mayo'), ('ing-sauce-shiso-miso'), ('ing-top-tobiko'),
  ('ing-top-guacamole'), ('ing-top-wakame'), ('ing-top-crab-salad'), ('ing-top-edamame'),
  ('ing-top-mushroom'), ('ing-top-radish'), ('ing-top-tomato'), ('ing-top-pineapple'),
  ('ing-top-eggplant'), ('ing-top-jalapeno'), ('ing-top-sauerkraut'), ('ing-top-quail-egg'),
  ('ing-top-mango'), ('ing-top-ginger'), ('ing-top-miso-corn'), ('ing-top-spring-onion'),
  ('ing-top-coriander'), ('ing-crisp-fried-shallot'), ('ing-crisp-sesame'), ('ing-crisp-nori'),
  ('ing-crisp-furikake'), ('ing-crisp-togarashi')
) as i(id)
cross join generate_series(0, 6) as d(wd)
on conflict (ingredient_id, weekday) do nothing;

notify pgrst, 'reload schema';
