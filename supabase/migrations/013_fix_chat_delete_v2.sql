-- Fix chat delete: the WITH CHECK on own-message policy must allow
-- the row to pass after updating deleted_at (user_id doesn't change,
-- so auth.uid() = user_id is still true — but we need to ensure no
-- conflicting FOR ALL policy blocks this with a stricter WITH CHECK).

do $$
begin
  -- Drop all existing chat update/delete policies
  drop policy if exists "chat_delete_own" on chat_messages;
  drop policy if exists "chat_delete_admin" on chat_messages;
  drop policy if exists "chat_write_own" on chat_messages;
  drop policy if exists "chat_own" on chat_messages;
  -- Drop any catch-all policy that may be interfering
  drop policy if exists "chat_messages_own" on chat_messages;
end $$;

-- Re-create: own users can INSERT their own messages and soft-delete (UPDATE) their own
create policy "chat_insert_own" on chat_messages
  for insert with check (auth.uid() = user_id);

create policy "chat_update_own" on chat_messages
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can update (soft-delete) any message
create policy "chat_update_admin" on chat_messages
  for update
  using (exists (select 1 from users where id = auth.uid() and is_admin = true))
  with check (true);
