-- Poke Hanoi — Tồn kho BOM theo ngày: nguyên liệu + công thức + hạn mức theo thứ + RPC trừ kho atomic.
-- Chạy trong Supabase → SQL Editor. KHÔNG có khối `alter publication` (tránh rollback). Bật realtime
-- cho ingredient_stock qua Dashboard → Database → Replication.

-- 1) Nguyên liệu (đơn vị tồn kho thật)
create table if not exists ingredient (
  id text primary key,                 -- 'ing-salmon'
  name_vi text not null,
  unit text not null default 'phần',   -- 'phần' | 'chai' | 'gram' | 'ml'
  created_at timestamptz not null default now()
);

-- 2) Công thức (BOM): 1 đơn vị MÓN tiêu thụ bao nhiêu nguyên liệu
create table if not exists recipe (
  item_id text not null,               -- id món trong data/menu.json
  ingredient_id text not null references ingredient(id) on delete cascade,
  qty_per_unit numeric not null check (qty_per_unit > 0),
  primary key (item_id, ingredient_id)
);
create index if not exists recipe_ingredient_idx on recipe (ingredient_id);

-- 3) Hạn mức mặc định theo thứ (0=CN..6=T7, khớp extract(dow) & JS getDay)
create table if not exists ingredient_quota (
  ingredient_id text not null references ingredient(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  quota_amount numeric not null check (quota_amount >= 0),
  primary key (ingredient_id, weekday)
);

-- 4) Tồn kho còn lại HÔM NAY (counter, reset lười theo quota)
create table if not exists ingredient_stock (
  ingredient_id text not null references ingredient(id) on delete cascade,
  date date not null,
  remaining numeric not null,
  primary key (ingredient_id, date)
);

-- ───────────────────────── RLS ─────────────────────────
alter table ingredient enable row level security;
alter table recipe enable row level security;
alter table ingredient_quota enable row level security;
alter table ingredient_stock enable row level security;

-- Builder (anon) đọc nguyên liệu/công thức/tồn kho để ẩn món hết hàng realtime
drop policy if exists "public read ingredient" on ingredient;
create policy "public read ingredient" on ingredient for select using (true);
drop policy if exists "public read recipe" on recipe;
create policy "public read recipe" on recipe for select using (true);
drop policy if exists "public read stock" on ingredient_stock;
create policy "public read stock" on ingredient_stock for select using (true);

-- Quota: chỉ staff đọc/ghi
drop policy if exists "staff read quota" on ingredient_quota;
create policy "staff read quota" on ingredient_quota for select
  using (auth.uid() in (select user_id from staff));
drop policy if exists "staff write quota" on ingredient_quota;
create policy "staff write quota" on ingredient_quota for all
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));

-- Staff chỉnh nguyên liệu/công thức/tồn kho (vd nạp lại hàng); ghi tồn kho khi đặt đơn đi qua RPC (definer)
drop policy if exists "staff write ingredient" on ingredient;
create policy "staff write ingredient" on ingredient for all
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));
drop policy if exists "staff write recipe" on recipe;
create policy "staff write recipe" on recipe for all
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));
drop policy if exists "staff write stock" on ingredient_stock;
create policy "staff write stock" on ingredient_stock for all
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));

-- ───────────────────── Seed nguyên liệu ─────────────────────
insert into ingredient (id, name_vi, unit) values
  ('ing-salmon', 'Cá hồi', 'phần'),
  ('ing-tuna', 'Cá ngừ', 'phần'),
  ('ing-octopus', 'Bạch tuộc', 'phần'),
  ('ing-shrimp', 'Tôm', 'phần'),
  ('ing-tofu', 'Đậu phụ (chay)', 'phần'),
  ('ing-sushi-rice', 'Cơm Nhật', 'phần'),
  ('ing-brown-rice', 'Cơm gạo lứt', 'phần'),
  ('ing-salad', 'Salad', 'phần'),
  ('ing-drink-orange-carrot', 'Nước ép Cam + cà rốt', 'chai'),
  ('ing-drink-coconut', 'Dừa tươi', 'chai'),
  ('ing-drink-watermelon', 'Nước ép Dưa hấu', 'chai'),
  ('ing-drink-pineapple-mango', 'Nước ép Dứa + xoài', 'chai'),
  ('ing-drink-guava-strawberry', 'Nước ép Ổi + dâu', 'chai'),
  ('ing-drink-guava-cucumber', 'Nước ép Ổi + dưa leo', 'chai')
on conflict (id) do nothing;

-- ───────────────────── Seed công thức (BOM) ─────────────────────
-- Đạm: thường & cay dùng chung nguyên liệu thô. Mix-base dùng 0.5 cơm + 0.5 salad.
insert into recipe (item_id, ingredient_id, qty_per_unit) values
  ('poke-salmon', 'ing-salmon', 1),
  ('poke-spicy-salmon', 'ing-salmon', 1),
  ('poke-tuna', 'ing-tuna', 1),
  ('poke-spicy-tuna', 'ing-tuna', 1),
  ('poke-octopus', 'ing-octopus', 1),
  ('poke-shrimp', 'ing-shrimp', 1),
  ('poke-vegan', 'ing-tofu', 1),
  ('base-sushi-rice', 'ing-sushi-rice', 1),
  ('base-brown-rice', 'ing-brown-rice', 1),
  ('base-salad', 'ing-salad', 1),
  ('base-mix-sushi-salad', 'ing-sushi-rice', 0.5),
  ('base-mix-sushi-salad', 'ing-salad', 0.5),
  ('base-mix-brown-salad', 'ing-brown-rice', 0.5),
  ('base-mix-brown-salad', 'ing-salad', 0.5),
  ('drink-orange-carrot', 'ing-drink-orange-carrot', 1),
  ('drink-coconut', 'ing-drink-coconut', 1),
  ('drink-watermelon', 'ing-drink-watermelon', 1),
  ('drink-pineapple-mango', 'ing-drink-pineapple-mango', 1),
  ('drink-guava-strawberry', 'ing-drink-guava-strawberry', 1),
  ('drink-guava-cucumber', 'ing-drink-guava-cucumber', 1)
on conflict (item_id, ingredient_id) do nothing;

-- ───────────────────── Seed quota mặc định (mọi thứ trong tuần) ─────────────────────
insert into ingredient_quota (ingredient_id, weekday, quota_amount)
select i.id, d.wd, i.q
from (values
  ('ing-salmon', 30), ('ing-tuna', 30), ('ing-octopus', 20), ('ing-shrimp', 25),
  ('ing-tofu', 20), ('ing-sushi-rice', 60), ('ing-brown-rice', 50), ('ing-salad', 50),
  ('ing-drink-orange-carrot', 20), ('ing-drink-coconut', 20), ('ing-drink-watermelon', 20),
  ('ing-drink-pineapple-mango', 20), ('ing-drink-guava-strawberry', 20), ('ing-drink-guava-cucumber', 20)
) as i(id, q)
cross join generate_series(0, 6) as d(wd)
on conflict (ingredient_id, weekday) do nothing;

-- ───────────────────── RPC trừ kho atomic + tạo đơn ─────────────────────
-- Route gọi qua service-role. Trừ kho + insert đơn trong CÙNG transaction. Lock theo id (chống deadlock),
-- giữ tới commit (chống race giành phần cuối). Nguyên liệu KHÔNG có quota hôm nay = vô hạn (bỏ qua).
create or replace function place_order(
  p_items jsonb,
  p_table_no int,
  p_user_id uuid,
  p_total_kcal int,
  p_total_protein numeric,
  p_total_fat numeric,
  p_total_fiber numeric,
  p_total_price int,
  p_pay_method text,
  p_size text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_wd smallint := extract(dow from (now() at time zone 'Asia/Ho_Chi_Minh'))::smallint;
  r record;
  v_remaining numeric;
  v_id uuid;
  v_token text;
begin
  -- Mỗi nguyên liệu cần (gộp mọi món), lock + check + trừ trong cùng vòng lặp, thứ tự id (deadlock-safe).
  for r in
    select rc.ingredient_id as iid, sum(rc.qty_per_unit * (li.qty)::numeric) as need
    from jsonb_to_recordset(p_items) as li(id text, qty int)
    join recipe rc on rc.item_id = li.id
    group by rc.ingredient_id
    order by rc.ingredient_id
  loop
    -- chỉ kiểm soát nguyên liệu có quota cho thứ hôm nay
    if exists (select 1 from ingredient_quota q where q.ingredient_id = r.iid and q.weekday = v_wd) then
      -- reset lười: tạo dòng tồn hôm nay từ quota nếu chưa có
      insert into ingredient_stock (ingredient_id, date, remaining)
      select r.iid, v_today, q.quota_amount
      from ingredient_quota q
      where q.ingredient_id = r.iid and q.weekday = v_wd
      on conflict (ingredient_id, date) do nothing;

      -- khóa dòng tồn (giữ tới commit) rồi đọc
      select remaining into v_remaining
      from ingredient_stock
      where ingredient_id = r.iid and date = v_today
      for update;

      if v_remaining < r.need then
        raise exception 'OUT_OF_STOCK:%', coalesce((select name_vi from ingredient where id = r.iid), r.iid);
      end if;

      update ingredient_stock
      set remaining = remaining - r.need
      where ingredient_id = r.iid and date = v_today;
    end if;
  end loop;

  insert into orders (
    table_no, user_id, items, total_kcal, total_protein, total_fat, total_fiber,
    total_price, pay_method, status
  ) values (
    p_table_no, p_user_id, p_items, p_total_kcal, p_total_protein, p_total_fat, p_total_fiber,
    p_total_price, p_pay_method, 'pending'
  ) returning id, order_token into v_id, v_token;

  return json_build_object('id', v_id, 'order_token', v_token);
end;
$$;

-- Chỉ service-role (route server) được gọi; client không gọi trực tiếp.
revoke execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text) from public, anon, authenticated;
grant execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text) to service_role;

-- Báo PostgREST nạp lại schema (tránh PGRST205).
notify pgrst, 'reload schema';
