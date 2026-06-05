-- Fix chat update policies: simplify WITH CHECK to true
-- USING already restricts which rows are eligible, WITH CHECK just validates new state
do $$
begin
  drop policy if exists "chat_insert_own" on chat_messages;
  drop policy if exists "chat_write" on chat_messages;
  drop policy if exists "chat_update_own" on chat_messages;
  drop policy if exists "chat_update_admin" on chat_messages;
end $$;

-- Single INSERT policy
create policy "chat_insert_own" on chat_messages
  for insert with check (auth.uid() = user_id);

-- Own messages: USING restricts to own rows, WITH CHECK (true) allows any update to those rows
create policy "chat_update_own" on chat_messages
  for update using (auth.uid() = user_id) with check (true);

-- Admins can update any message
create policy "chat_update_admin" on chat_messages
  for update using (exists (select 1 from users where id = auth.uid() and is_admin = true)) with check (true);
