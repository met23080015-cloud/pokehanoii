-- Poke Hanoi — SePay auto-confirm thanh toán QR
-- Chạy trong Supabase → SQL Editor (sau 0008).
-- Cơ chế: mỗi đơn có pay_code duy nhất (PKH+8 hex đầu của id) nhúng vào nội dung CK.
-- SePay theo dõi tài khoản → bắn webhook → route trích pay_code từ content,
-- khớp pay_code + đúng số tiền + chưa trả → set paid=true (idempotent qua payment_events).

-- ───────────────────── 1) Mã thanh toán duy nhất theo đơn ─────────────────────
-- Generated column: DB là nguồn chân lý, không sinh ở app (tránh lệch công thức).
-- Banks viết hoa + bỏ dấu nội dung CK → mã chỉ gồm [A-Z0-9], khớp được bằng substring.
alter table orders
  add column if not exists pay_code text
  generated always as ('PKH' || upper(substr(replace(id::text, '-', ''), 1, 8))) stored;

create index if not exists orders_pay_code_idx on orders (pay_code);

-- ───────────────────── 2) Log webhook (idempotency + audit) ─────────────────────
-- sepay_id là khoá chính → cùng 1 giao dịch bắn lại nhiều lần chỉ ghi 1 dòng.
create table if not exists payment_events (
  sepay_id       bigint primary key,
  order_id       uuid references orders(id) on delete set null,
  amount         int not null default 0,
  content        text,
  reference_code text,
  gateway        text,
  raw            jsonb,
  created_at     timestamptz not null default now()
);

-- RLS bật, KHÔNG tạo policy cho anon/authenticated → chỉ service_role (route server) đọc/ghi.
alter table payment_events enable row level security;

-- ───────────────────── 3) RPC xác nhận thanh toán (atomic + idempotent) ─────────────────────
create or replace function confirm_sepay_payment(
  p_sepay_id   bigint,
  p_amount     int,
  p_content    text,
  p_reference  text,
  p_gateway    text,
  p_pay_code   text,
  p_raw        jsonb
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_matched  boolean := false;
begin
  -- Idempotency: giao dịch này đã xử lý → trả ngay, không làm gì thêm.
  if exists (select 1 from payment_events where sepay_id = p_sepay_id) then
    return json_build_object('status', 'duplicate');
  end if;

  -- Khớp đơn: đúng mã + đúng số tiền + chưa trả. Khoá dòng tới commit (chống double-credit).
  if p_pay_code is not null and length(p_pay_code) > 0 then
    select id into v_order_id
    from orders
    where pay_code = p_pay_code and total_price = p_amount and paid = false
    order by created_at desc
    limit 1
    for update;

    if found then
      update orders set paid = true where id = v_order_id;  -- trigger loyalty tự cộng điểm
      v_matched := true;
    end if;
  end if;

  insert into payment_events (sepay_id, order_id, amount, content, reference_code, gateway, raw)
  values (p_sepay_id, v_order_id, p_amount, p_content, p_reference, p_gateway, p_raw);

  return json_build_object(
    'status',   case when v_matched then 'matched' else 'unmatched' end,
    'order_id', v_order_id
  );
end;
$$;

revoke execute on function confirm_sepay_payment(bigint,int,text,text,text,text,jsonb) from public, anon, authenticated;
grant  execute on function confirm_sepay_payment(bigint,int,text,text,text,text,jsonb) to service_role;

-- ───────────────────── 4) place_order trả thêm pay_code ─────────────────────
-- (Sao từ 0008, chỉ thêm v_pay_code vào RETURNING + json trả về. Chữ ký không đổi.)
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
  v_pay_code text;
begin
  for r in
    select rc.ingredient_id as iid, sum(rc.qty_per_unit * (li.qty)::numeric) as need
    from jsonb_to_recordset(p_items) as li(id text, qty int)
    join recipe rc on rc.item_id = li.id
    group by rc.ingredient_id
    order by rc.ingredient_id
  loop
    if exists (select 1 from ingredient_quota q where q.ingredient_id = r.iid and q.weekday = v_wd) then
      insert into ingredient_stock (ingredient_id, date, remaining)
      select r.iid, v_today, q.quota_amount
      from ingredient_quota q
      where q.ingredient_id = r.iid and q.weekday = v_wd
      on conflict (ingredient_id, date) do nothing;

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
  ) returning id, order_token, pay_code into v_id, v_token, v_pay_code;

  return json_build_object('id', v_id, 'order_token', v_token, 'pay_code', v_pay_code);
end;
$$;

revoke execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text) from public, anon, authenticated;
grant execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text) to service_role;

notify pgrst, 'reload schema';
