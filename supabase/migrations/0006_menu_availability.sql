-- Poke Hanoi — Auto-86: danh sách món tạm hết hàng (ẩn realtime khỏi builder)
-- Chạy trong Supabase → SQL Editor.

create table if not exists menu_unavailable (
  item_id text primary key,
  created_at timestamptz not null default now()
);

alter table menu_unavailable enable row level security;

-- Khách (anon) ĐỌC được để builder ẩn món hết hàng
drop policy if exists "public read unavailable" on menu_unavailable;
create policy "public read unavailable" on menu_unavailable for select using (true);

-- Chỉ staff bật/tắt (insert = 86, delete = mở lại)
drop policy if exists "staff insert unavailable" on menu_unavailable;
create policy "staff insert unavailable" on menu_unavailable for insert
  with check (auth.uid() in (select user_id from staff));
drop policy if exists "staff delete unavailable" on menu_unavailable;
create policy "staff delete unavailable" on menu_unavailable for delete
  using (auth.uid() in (select user_id from staff));

-- Realtime để builder + admin cập nhật tức thì.
-- Bắt MỌI exception (vd publication ở chế độ FOR ALL TABLES) để KHÔNG rollback bảng.
do $$ begin
  alter publication supabase_realtime add table menu_unavailable;
exception when others then null; end $$;

-- Báo PostgREST nạp lại schema để thấy bảng mới ngay (tránh lỗi PGRST205).
notify pgrst, 'reload schema';
