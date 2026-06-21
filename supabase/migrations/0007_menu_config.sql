-- Poke Hanoi — cấu hình giá sửa được từ admin (không cần code)
-- Seed bằng đúng giá hiện tại trong menu.json để KHÔNG đổi gì cho tới khi admin sửa.
-- Chạy trong Supabase → SQL Editor.

create table if not exists menu_config (
  id int primary key default 1,
  base_price int not null,
  extra_poke_fee int not null,
  updated_at timestamptz not null default now(),
  constraint menu_config_single_row check (id = 1)
);

insert into menu_config (id, base_price, extra_poke_fee)
values (1, 198000, 48000)
on conflict (id) do nothing;

alter table menu_config enable row level security;

-- Ai cũng đọc được (builder tính giá); chỉ staff sửa
drop policy if exists "public read config" on menu_config;
create policy "public read config" on menu_config for select using (true);

drop policy if exists "staff update config" on menu_config;
create policy "staff update config" on menu_config for update
  using (auth.uid() in (select user_id from staff))
  with check (auth.uid() in (select user_id from staff));

do $$ begin
  alter publication supabase_realtime add table menu_config;
exception when others then null; end $$;

notify pgrst, 'reload schema';
