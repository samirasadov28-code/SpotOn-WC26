-- app_config
create table if not exists app_config (
  id int primary key default 1,
  lock_at timestamptz not null,
  first_match_at timestamptz not null
);
insert into app_config (id, lock_at, first_match_at) values (
  1,
  '2026-06-11 13:00:00+00',
  '2026-06-11 15:00:00+00'
) on conflict (id) do nothing;

-- users (extends auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- leagues
create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text unique not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- league_members
create table if not exists league_members (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fifa_code text not null unique,
  group_letter text not null check (group_letter in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  flag_emoji text,
  blurb text,
  stars text[],
  confederation text
);

-- Rename old columns if they exist from a previous schema version
do $$ begin
  if exists (select 1 from information_schema.columns where table_name='matches' and column_name='actual_home_score') then
    alter table matches rename column actual_home_score to home_score;
    alter table matches rename column actual_away_score to away_score;
    alter table matches rename column actual_winner_id to winner_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name='matches' and column_name='stage') then
    -- Update old stage values to new schema
    update matches set ko_stage = stage, stage = 'knockout' where stage in ('r32','r16','qf','sf','final','third');
  end if;
exception when others then null;
end $$;

-- matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group','knockout')),
  group_letter text,
  ko_stage text check (ko_stage in ('r32','r16','qf','sf','final','third')),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  kickoff_at timestamptz,
  home_score int,
  away_score int,
  winner_id uuid references teams(id),
  decided_by text check (decided_by in ('ft','et','pens')),
  bracket_slot int,
  venue text,
  is_final boolean default false
);

-- predictions_group
create table if not exists predictions_group (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  pred_home_score int,
  pred_away_score int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, match_id)
);

-- predictions_knockout
create table if not exists predictions_knockout (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  bracket_slot int not null,
  pred_home_team_id uuid references teams(id),
  pred_away_team_id uuid references teams(id),
  pred_home_score int,
  pred_away_score int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, bracket_slot)
);

-- predicted_brackets (cached bracket per user)
create table if not exists predicted_brackets (
  user_id uuid primary key references users(id) on delete cascade,
  bracket_data jsonb not null,
  computed_at timestamptz default now()
);

-- scores
create table if not exists scores (
  user_id uuid primary key references users(id) on delete cascade,
  group_pts int default 0,
  advancement_pts int default 0,
  knockout_match_pts int default 0,
  total_pts int default 0,
  updated_at timestamptz default now()
);

-- players (squads)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  name text not null,
  position text check (position in ('GK','DEF','MID','FWD')),
  club text,
  shirt_number int,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- chat_messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- notification_prefs
create table if not exists notification_prefs (
  user_id uuid primary key references users(id) on delete cascade,
  email_lock_reminder boolean default true,
  email_lock_confirmed boolean default true,
  email_leaderboard_digest boolean default false
);

-- RLS
alter table users enable row level security;
alter table predictions_group enable row level security;
alter table predictions_knockout enable row level security;
alter table predicted_brackets enable row level security;
alter table scores enable row level security;
alter table chat_messages enable row level security;
alter table notification_prefs enable row level security;
alter table league_members enable row level security;

-- Drop policies before recreating (idempotent)
do $$ begin
  drop policy if exists "users_own" on users;
  drop policy if exists "pg_own_write" on predictions_group;
  drop policy if exists "pk_own" on predictions_knockout;
  drop policy if exists "pb_own" on predicted_brackets;
  drop policy if exists "scores_read" on scores;
  drop policy if exists "scores_own_write" on scores;
  drop policy if exists "chat_read" on chat_messages;
  drop policy if exists "chat_write" on chat_messages;
  drop policy if exists "chat_delete_own" on chat_messages;
  drop policy if exists "notif_own" on notification_prefs;
  drop policy if exists "lm_own" on league_members;
  drop policy if exists "matches_read" on matches;
  drop policy if exists "teams_read" on teams;
  drop policy if exists "matches_public_read" on matches;
  drop policy if exists "teams_public_read" on teams;
end $$;

-- matches and teams: publicly readable (no auth required)
alter table matches enable row level security;
alter table teams enable row level security;
create policy "matches_public_read" on matches for select using (true);
create policy "teams_public_read" on teams for select using (true);

create policy "users_own" on users for all using (auth.uid() = id);
create policy "pg_own_write" on predictions_group for all using (auth.uid() = user_id);
create policy "pk_own" on predictions_knockout for all using (auth.uid() = user_id);
create policy "pb_own" on predicted_brackets for all using (auth.uid() = user_id);
create policy "scores_read" on scores for select using (auth.role() = 'authenticated');
create policy "scores_own_write" on scores for all using (auth.uid() = user_id);
create policy "chat_read" on chat_messages for select using (auth.role() = 'authenticated' and deleted_at is null);
create policy "chat_write" on chat_messages for insert with check (auth.uid() = user_id);
create policy "chat_delete_own" on chat_messages for update using (auth.uid() = user_id);
create policy "notif_own" on notification_prefs for all using (auth.uid() = user_id);
create policy "lm_own" on league_members for all using (auth.uid() = user_id);
