-- Allow authenticated users to read prediction rows (for leaderboard participant discovery).
-- Restrict writes to own rows only.
-- We drop the "for all" policies and split them into read + write policies.

do $$
begin
  drop policy if exists "pg_own_write" on predictions_group;
  drop policy if exists "pk_own" on predictions_knockout;
  drop policy if exists "pg_read_auth" on predictions_group;
  drop policy if exists "pk_read_auth" on predictions_knockout;
  drop policy if exists "pg_write_own" on predictions_group;
  drop policy if exists "pk_write_own" on predictions_knockout;
end $$;

-- Any authenticated user can read predictions (needed for leaderboard)
create policy "pg_read_auth" on predictions_group
  for select using (auth.role() = 'authenticated');

create policy "pk_read_auth" on predictions_knockout
  for select using (auth.role() = 'authenticated');

-- Only own user can write their own predictions
create policy "pg_write_own" on predictions_group
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pk_write_own" on predictions_knockout
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
