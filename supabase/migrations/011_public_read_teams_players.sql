-- Teams and players are public data — anyone (including unauthenticated) can read them.
-- Previously RLS was enabled on both tables with no read policy, blocking all reads.

create policy "teams_read_public" on teams
  for select using (true);

create policy "players_read_public" on players
  for select using (true);
