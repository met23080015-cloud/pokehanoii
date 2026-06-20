-- Poke Hanoi — P1: tài khoản khách (email magic-link) + loyalty điểm + lịch sử đơn
-- Chạy trong Supabase → SQL Editor.

-- 1) Gắn đơn với user (nullable — khách vãng lai vẫn đặt được)
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_idx on orders (user_id);

-- 2) Hồ sơ khách + điểm tích lũy
create table if not exists customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points int not null default 0,
  created_at timestamptz not null default now()
);
alter table customers enable row level security;
drop policy if exists "user read own customer" on customers;
create policy "user read own customer" on customers for select using (auth.uid() = user_id);
-- KHÔNG có policy update cho user → điểm chỉ được cộng qua server (service role) để chống gian lận.

-- 3) Khách đã đăng nhập đọc được ĐƠN CỦA MÌNH (ngoài staff đọc tất cả)
drop policy if exists "user read own orders" on orders;
create policy "user read own orders" on orders for select using (user_id = auth.uid());

-- 4) Cộng điểm (không grant cho client để chống farm điểm)
create or replace function award_points(p_user uuid, p_points int)
returns void
language sql
security definer
set search_path = public
as $$
  insert into customers(user_id, points) values (p_user, p_points)
  on conflict (user_id) do update set points = customers.points + excluded.points;
$$;
revoke execute on function award_points(uuid, int) from public, anon, authenticated;

-- 5) Chỉ cộng điểm khi đơn THỰC SỰ ĐƯỢC THANH TOÁN (paid: false→true), chống farm đơn chưa trả
create or replace function _award_points_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.paid = true and coalesce(OLD.paid, false) = false and NEW.user_id is not null then
    perform award_points(NEW.user_id, floor(NEW.total_price / 10000)::int);
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_loyalty on orders;
create trigger trg_loyalty after update of paid on orders
  for each row execute function _award_points_on_paid();
