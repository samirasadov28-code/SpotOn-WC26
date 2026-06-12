-- Safe idempotent fix for predictions_group and predictions_knockout RLS
-- Drops ALL existing policies on both tables then recreates them cleanly

do $$ begin
  -- predictions_group: drop everything
  drop policy if exists "pg_own_write"   on predictions_group;
  drop policy if exists "pg_read_auth"   on predictions_group;
  drop policy if exists "pg_write_own"   on predictions_group;
  drop policy if exists "predictions_group_own" on predictions_group;

  -- predictions_knockout: drop everything
  drop policy if exists "pk_own"         on predictions_knockout;
  drop policy if exists "pk_read_auth"   on predictions_knockout;
  drop policy if exists "pk_write_own"   on predictions_knockout;
  drop policy if exists "predictions_knockout_own" on predictions_knockout;
end $$;

-- predictions_group: any authenticated user reads; only own row for writes
create policy "pg_read_auth" on predictions_group
  for select using (auth.role() = 'authenticated');

create policy "pg_write_own" on predictions_group
  for insert with check (auth.uid() = user_id);

create policy "pg_update_own" on predictions_group
  for update using (auth.uid() = user_id);

create policy "pg_delete_own" on predictions_group
  for delete using (auth.uid() = user_id);

-- predictions_knockout: same split
create policy "pk_read_auth" on predictions_knockout
  for select using (auth.role() = 'authenticated');

create policy "pk_write_own" on predictions_knockout
  for insert with check (auth.uid() = user_id);

create policy "pk_update_own" on predictions_knockout
  for update using (auth.uid() = user_id);

create policy "pk_delete_own" on predictions_knockout
  for delete using (auth.uid() = user_id);
