-- app_config
create table app_config (
  id int primary key default 1,
  lock_at timestamptz not null,
  first_match_at timestamptz not null
);
insert into app_config (id, lock_at, first_match_at) values (
  1,
  '2026-06-11 13:00:00+00',
  '2026-06-11 15:00:00+00'
);

-- users (extends auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- leagues
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text unique not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- league_members
create table league_members (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fifa_code text not null unique,
  group_letter text not null check (group_letter in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  flag_emoji text,
  blurb text,
  stars text[],
  confederation text
);

-- matches
create table matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group','r32','r16','qf','sf','final','third')),
  group_letter text,
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  kickoff_at timestamptz,
  actual_home_score int,
  actual_away_score int,
  actual_winner_id uuid references teams(id),
  decided_by text check (decided_by in ('ft','et','pens')),
  bracket_slot int,
  venue text,
  is_final boolean default false
);

-- predictions_group
create table predictions_group (
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
create table predictions_knockout (
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
create table predicted_brackets (
  user_id uuid primary key references users(id) on delete cascade,
  bracket_data jsonb not null,
  computed_at timestamptz default now()
);

-- scores
create table scores (
  user_id uuid primary key references users(id) on delete cascade,
  group_pts int default 0,
  advancement_pts int default 0,
  knockout_match_pts int default 0,
  total_pts int default 0,
  updated_at timestamptz default now()
);

-- players (squads)
create table players (
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
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- notification_prefs
create table notification_prefs (
  user_id uuid primary key references users(id) on delete cascade,
  email_lock_reminder boolean default true,
  email_lock_confirmed boolean default true,
  email_leaderboard_digest boolean default false
);

-- RLS policies
alter table users enable row level security;
alter table predictions_group enable row level security;
alter table predictions_knockout enable row level security;
alter table predicted_brackets enable row level security;
alter table scores enable row level security;
alter table chat_messages enable row level security;
alter table notification_prefs enable row level security;
alter table league_members enable row level security;

-- users: can read/write own row
create policy "users_own" on users for all using (auth.uid() = id);

-- predictions_group: before lock, own only; after lock, all league members can read
create policy "pg_own_write" on predictions_group for all using (auth.uid() = user_id);

-- predictions_knockout: own only before lock
create policy "pk_own" on predictions_knockout for all using (auth.uid() = user_id);

-- predicted_brackets: own only
create policy "pb_own" on predicted_brackets for all using (auth.uid() = user_id);

-- scores: readable by all authenticated
create policy "scores_read" on scores for select using (auth.role() = 'authenticated');
create policy "scores_own_write" on scores for all using (auth.uid() = user_id);

-- chat_messages: league members can read/write (simplified: authenticated)
create policy "chat_read" on chat_messages for select using (auth.role() = 'authenticated' and deleted_at is null);
create policy "chat_write" on chat_messages for insert with check (auth.uid() = user_id);
create policy "chat_delete_own" on chat_messages for update using (auth.uid() = user_id);

-- notification_prefs: own only
create policy "notif_own" on notification_prefs for all using (auth.uid() = user_id);

-- league_members: own + read all in same league
create policy "lm_own" on league_members for all using (auth.uid() = user_id);
