-- Fix infinite recursion in league_members SELECT policy.
-- The previous policy self-referenced league_members causing infinite recursion.
-- Simplest safe fix: any authenticated user can read all league_members.

do $$ begin
  drop policy if exists "lm_read_member" on league_members;
  drop policy if exists "lm_read_own" on league_members;
  drop policy if exists "lm_read_auth" on league_members;
end $$;

create policy "lm_read_auth" on league_members
  for select using (auth.role() = 'authenticated');
