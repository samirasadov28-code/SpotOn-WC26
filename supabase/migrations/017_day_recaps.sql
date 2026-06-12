create table if not exists day_recaps (
  cache_key text primary key,
  league_id uuid references leagues(id) on delete cascade,
  day_date date not null,
  recap_text text not null,
  created_at timestamptz default now()
);

alter table day_recaps enable row level security;

-- Anyone authenticated can read recaps
drop policy if exists "recaps_public_read" on day_recaps;
create policy "recaps_public_read" on day_recaps for select using (true);

-- Service role can insert and update (upsert)
drop policy if exists "recaps_service_write" on day_recaps;
drop policy if exists "recaps_service_insert" on day_recaps;
drop policy if exists "recaps_service_update" on day_recaps;
create policy "recaps_service_insert" on day_recaps for insert with check (true);
create policy "recaps_service_update" on day_recaps for update using (true);
