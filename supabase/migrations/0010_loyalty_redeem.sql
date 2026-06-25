-- Poke Hanoi — Đổi điểm lấy giảm giá (nửa "tiêu điểm" của loyalty)
-- Chạy trong Supabase → SQL Editor (sau 0009).
-- Quy đổi: 1 điểm = 1.000đ. Trần: tối đa 50% giá trị đơn.
-- Cơ chế chống gian lận (đồng bộ với 0004 — điểm chỉ "chạy" khi tiền chạy):
--   • Đặt đơn: KHÔNG trừ điểm ngay, chỉ "giữ chỗ" (reserve) = tổng điểm đã dùng ở các đơn CHƯA TRẢ.
--     → available = balance − reserved → chống double-spend mà không cần refund khi bỏ đơn.
--   • Trả tiền (paid false→true): trigger trừ điểm đã dùng + cộng điểm thưởng trên SỐ TIỀN THỰC TRẢ.

-- ───────────────────── 1) Lưu số điểm đã dùng trên đơn ─────────────────────
alter table orders
  add column if not exists points_redeemed int not null default 0;

-- ───────────────────── 2) place_order: nhận p_points_redeem, kẹp trần, trả total ròng ─────────────────────
-- Chữ ký ĐỔI (thêm p_points_redeem) → phải drop bản cũ trước khi tạo lại + cấp lại quyền.
drop function if exists place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text);

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
  p_size text,
  p_points_redeem int default 0
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
  v_bal int := 0;
  v_reserved int := 0;
  v_available int := 0;
  v_redeem int := 0;
  v_net int := p_total_price;
begin
  -- ── Trừ kho ATOMIC (giữ nguyên logic 0009) ──
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

  -- ── Đổi điểm (chỉ khi đã đăng nhập + có yêu cầu) ──
  if p_user_id is not null and coalesce(p_points_redeem, 0) > 0 then
    -- KHOÁ dòng điểm của khách tới commit → 2 đơn cùng lúc của 1 khách chạy tuần tự,
    -- không cùng "giữ chỗ" trên cùng số dư (chống double-spend khi đặt đồng thời).
    select points into v_bal from customers where user_id = p_user_id for update;
    v_bal := coalesce(v_bal, 0);

    -- reserved = điểm đã "giữ chỗ" ở các đơn CHƯA TRẢ → available = số dư − reserved.
    select coalesce(sum(points_redeemed), 0) into v_reserved
    from orders where user_id = p_user_id and paid = false;
    v_available := greatest(v_bal - v_reserved, 0);

    -- Kẹp theo: điểm yêu cầu, điểm khả dụng, và trần 50% đơn (1 điểm = 1.000đ).
    v_redeem := least(p_points_redeem, v_available, floor(p_total_price * 0.5 / 1000)::int);
    if v_redeem < 0 then v_redeem := 0; end if;
    v_net := p_total_price - v_redeem * 1000;
  end if;

  insert into orders (
    table_no, user_id, items, total_kcal, total_protein, total_fat, total_fiber,
    total_price, pay_method, status, points_redeemed
  ) values (
    p_table_no, p_user_id, p_items, p_total_kcal, p_total_protein, p_total_fat, p_total_fiber,
    v_net, p_pay_method, 'pending', v_redeem
  ) returning id, order_token, pay_code into v_id, v_token, v_pay_code;

  return json_build_object(
    'id', v_id,
    'order_token', v_token,
    'pay_code', v_pay_code,
    'total_price', v_net,
    'points_redeemed', v_redeem
  );
end;
$$;

revoke execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text,int) from public, anon, authenticated;
grant execute on function place_order(jsonb,int,uuid,int,numeric,numeric,numeric,int,text,text,int) to service_role;

-- ───────────────────── 3) award_points: chặn số dư âm (an toàn khi trừ điểm) ─────────────────────
-- VALUES giữ delta thật để on-conflict cộng đúng; chỉ KẸP kết quả cuối ≥ 0
-- → trừ nhiều hơn số dư (đua tranh hiếm) cũng không đẩy điểm xuống âm.
create or replace function award_points(p_user uuid, p_points int)
returns void
language sql
security definer
set search_path = public
as $$
  insert into customers(user_id, points) values (p_user, greatest(p_points, 0))
  on conflict (user_id) do update
    set points = greatest(customers.points + p_points, 0);
$$;
revoke execute on function award_points(uuid, int) from public, anon, authenticated;

-- ───────────────────── 4) Khi trả tiền: trừ điểm đã dùng + cộng điểm trên tiền thực trả ─────────────────────
create or replace function _award_points_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.paid = true and coalesce(OLD.paid, false) = false and NEW.user_id is not null then
    -- Trừ điểm đã đổi (giữ chỗ → tiêu thật khi tiền đã về).
    if coalesce(NEW.points_redeemed, 0) > 0 then
      perform award_points(NEW.user_id, -NEW.points_redeemed);
    end if;
    -- Cộng điểm thưởng trên SỐ TIỀN THỰC TRẢ (total_price đã trừ giảm giá).
    perform award_points(NEW.user_id, floor(NEW.total_price / 10000)::int);
  end if;
  return NEW;
end;
$$;

-- Đăng ký lại trigger ngay trong 0010 → migration tự chứa, không phụ thuộc thứ tự chạy lại 0004.
drop trigger if exists trg_loyalty on orders;
create trigger trg_loyalty after update of paid on orders
  for each row execute function _award_points_on_paid();

notify pgrst, 'reload schema';
