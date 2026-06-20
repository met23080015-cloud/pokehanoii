-- Poke Hanoi — Scale-up Phase 0: Staff Auth + siết RLS + order token
-- Chạy trong Supabase dashboard → SQL Editor (SAU khi deploy code auth mới + tạo staff user).

-- 1) Allowlist nhân viên (chỉ user trong bảng này mới xem/sửa đơn)
create table if not exists staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table staff enable row level security;
drop policy if exists "staff read own" on staff;
create policy "staff read own" on staff for select using (auth.uid() = user_id);

-- 2) Token bí mật để khách tra cứu đơn của mình (không cần đăng nhập)
alter table orders add column if not exists order_token uuid not null default gen_random_uuid();
create index if not exists orders_order_token_idx on orders (order_token);

-- 3) Gỡ policy prototype mở toang
drop policy if exists "anon read orders"   on orders;
drop policy if exists "anon insert orders" on orders;
drop policy if exists "anon update orders" on orders;

-- 4) Policy least-privilege
-- Đặt đơn: cho phép insert (server dùng service role bypass RLS; policy này là fallback an toàn)
drop policy if exists "place order" on orders;
create policy "place order" on orders for insert with check (true);

-- Đọc tất cả đơn: chỉ staff
drop policy if exists "staff read orders" on orders;
create policy "staff read orders" on orders for select
  using (auth.uid() in (select user_id from staff));

-- Cập nhật trạng thái: chỉ staff
drop policy if exists "staff update orders" on orders;
create policy "staff update orders" on orders for update
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));

-- 5) Khách xem 1 đơn của mình qua token (security definer → bỏ qua RLS, chỉ trả đúng 1 đơn khớp token)
create or replace function get_order_by_token(p_token uuid)
returns table (
  id uuid,
  order_token uuid,
  table_no int,
  items jsonb,
  total_kcal int,
  total_protein numeric,
  total_fat numeric,
  total_fiber numeric,
  total_price int,
  pay_method text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  -- liệt kê cột rõ (không select *) để không lộ cột nhạy cảm thêm sau này
  select id, order_token, table_no, items,
         total_kcal, total_protein, total_fat, total_fiber, total_price,
         pay_method, status, created_at
  from orders where order_token = p_token;
$$;
grant execute on function get_order_by_token(uuid) to anon, authenticated;

-- ============================================================
-- SAU KHI CHẠY: tạo staff user trong Authentication → Users (email + password),
-- rồi cấp quyền staff:
--   insert into staff(user_id) select id from auth.users where email = 'EMAIL_NHANVIEN';
-- ============================================================
