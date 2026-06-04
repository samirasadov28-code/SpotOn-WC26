create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  message     text not null,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table feedback enable row level security;

-- Anyone (including anonymous) can insert
create policy "feedback_insert" on feedback
  for insert with check (true);

-- Only admins can read (via service role / admin panel)
create policy "feedback_read_admin" on feedback
  for select using (
    exists (
      select 1 from users where id = auth.uid() and is_admin = true
    )
  );
