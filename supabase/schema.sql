-- Poke Hanoi — Supabase schema
-- Chạy trong Supabase dashboard → SQL Editor.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_no int,
  items jsonb not null default '[]'::jsonb,
  total_kcal int not null default 0,
  total_protein numeric not null default 0,
  total_fat numeric not null default 0,
  total_fiber numeric not null default 0,
  total_price int not null default 0,
  pay_method text not null default 'counter' check (pay_method in ('counter','vietqr')),
  status text not null default 'pending' check (status in ('pending','accepted','done')),
  created_at timestamptz not null default now()
);

-- Realtime: bật replication cho bảng orders
alter publication supabase_realtime add table orders;

-- RLS (PROTOTYPE — cho phép anon insert/select/update.
-- PRODUCTION: siết lại, tách quyền admin. Ghi rõ trong báo cáo.)
alter table orders enable row level security;

create policy "anon read orders"   on orders for select using (true);
create policy "anon insert orders" on orders for insert with check (true);
create policy "anon update orders" on orders for update using (true) with check (true);
