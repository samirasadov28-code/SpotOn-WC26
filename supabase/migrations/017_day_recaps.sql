create table if not exists day_recaps (
  cache_key text primary key,
  league_id uuid references leagues(id) on delete cascade,
  day_date date not null,
  recap_text text not null,
  created_at timestamptz default now()
);

-- Service role can read/write; public can only read
alter table day_recaps enable row level security;
create policy "recaps_public_read" on day_recaps for select using (true);
create policy "recaps_service_write" on day_recaps for all using (auth.role() = 'service_role');
