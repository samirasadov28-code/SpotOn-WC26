-- Enable RLS on leagues (not enabled in 001)
alter table leagues enable row level security;

-- Drop and recreate policies idempotently
do $$ begin
  drop policy if exists "leagues_read_member" on leagues;
  drop policy if exists "leagues_insert_auth" on leagues;
  drop policy if exists "leagues_public_read" on leagues;
  drop policy if exists "leagues_read_auth" on leagues;
  drop policy if exists "leagues_update_own" on leagues;
  drop policy if exists "lm_read_member" on league_members;
  drop policy if exists "lm_own" on league_members;
  drop policy if exists "lm_insert_own" on league_members;
  drop policy if exists "lm_delete_own" on league_members;
end $$;

-- Anyone authenticated can read leagues (needed for join by code)
create policy "leagues_read_auth" on leagues for select using (auth.role() = 'authenticated');
-- Authenticated users can create leagues
create policy "leagues_insert_auth" on leagues for insert with check (auth.role() = 'authenticated');
-- League creator can update their league
create policy "leagues_update_own" on leagues for update using (auth.uid() = created_by);

-- League members: users can read members of leagues they belong to
create policy "lm_read_member" on league_members for select using (
  auth.uid() = user_id
  or exists (
    select 1 from league_members lm2
    where lm2.league_id = league_members.league_id and lm2.user_id = auth.uid()
  )
);
-- Users can insert themselves into a league
create policy "lm_insert_own" on league_members for insert with check (auth.uid() = user_id);
-- Users can remove themselves
create policy "lm_delete_own" on league_members for delete using (auth.uid() = user_id);
