-- Poke Hanoi — P1: cờ thanh toán (admin xác nhận thủ công, thay cho SePay đã skip)
-- Chạy trong Supabase → SQL Editor.
alter table orders add column if not exists paid boolean not null default false;
-- RLS update đã có policy "staff update orders" ở migration 0002 → staff đổi paid được.

-- Cập nhật RPC để khách thấy trạng thái thanh toán trên trang theo dõi đơn
-- DROP trước vì đổi return type (thêm cột paid) — create or replace không đổi được return type
drop function if exists get_order_by_token(uuid);
create function get_order_by_token(p_token uuid)
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
  paid boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, order_token, table_no, items,
         total_kcal, total_protein, total_fat, total_fiber, total_price,
         pay_method, status, paid, created_at
  from orders where order_token = p_token;
$$;
grant execute on function get_order_by_token(uuid) to anon, authenticated;
