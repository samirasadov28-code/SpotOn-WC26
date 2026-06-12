-- Allow any authenticated user to read all predictions (needed for Day View, recap, etc.)
-- The existing write policies stay unchanged — users can only write their own rows.

do $$ begin
  drop policy if exists "pg_own_write" on predictions_group;
  drop policy if exists "pk_own" on predictions_knockout;
end $$;

-- predictions_group: anyone authenticated can read; own row for write
create policy "pg_read_auth" on predictions_group
  for select using (auth.role() = 'authenticated');
create policy "pg_write_own" on predictions_group
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- predictions_knockout: same split
create policy "pk_read_auth" on predictions_knockout
  for select using (auth.role() = 'authenticated');
create policy "pk_write_own" on predictions_knockout
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
