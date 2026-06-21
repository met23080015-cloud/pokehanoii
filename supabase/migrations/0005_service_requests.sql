-- Poke Hanoi — yêu cầu tại bàn (gọi phục vụ / xin thanh toán / góp ý)
-- Lấy ý tưởng từ trang gọi món o2o của iPOS: 3 ô thao tác nhanh gửi tín hiệu realtime về quầy.
-- Chạy trong Supabase → SQL Editor.

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  table_no int,
  type text not null check (type in ('service', 'bill', 'feedback')),
  note text,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists service_requests_open_idx on service_requests (status, created_at desc);

alter table service_requests enable row level security;

-- Khách (anon) gửi yêu cầu: chỉ insert (server dùng service role; policy này là fallback an toàn)
drop policy if exists "place service request" on service_requests;
create policy "place service request" on service_requests for insert with check (true);

-- Đọc + cập nhật: chỉ staff trong allowlist
drop policy if exists "staff read service_requests" on service_requests;
create policy "staff read service_requests" on service_requests for select
  using (auth.uid() in (select user_id from staff));

drop policy if exists "staff update service_requests" on service_requests;
create policy "staff update service_requests" on service_requests for update
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));

-- Bật realtime cho bảng (bỏ qua nếu đã thêm)
do $$ begin
  alter publication supabase_realtime add table service_requests;
exception when duplicate_object then null; end $$;
