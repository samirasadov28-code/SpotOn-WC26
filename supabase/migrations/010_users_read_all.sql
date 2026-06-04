-- Allow any authenticated user to read display_name and id from all users.
-- Required for the leaderboard to show all participants.
-- The existing users_own policy covers INSERT/UPDATE/DELETE for own row only
-- (we split it below so SELECT isn't restricted to own row).

do $$
begin
  drop policy if exists "users_own" on users;
  drop policy if exists "users_read_auth" on users;
  drop policy if exists "users_write_own" on users;
end $$;

-- Any signed-in user can read all user rows (needed for leaderboard + chat display names)
create policy "users_read_auth" on users
  for select using (auth.role() = 'authenticated');

-- Each user can only write their own row
create policy "users_write_own" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);
