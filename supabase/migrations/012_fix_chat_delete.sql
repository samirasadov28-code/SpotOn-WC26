-- Fix chat delete policies: add WITH CHECK clause so UPDATE succeeds
do $$
begin
  drop policy if exists "chat_delete_own" on chat_messages;
  drop policy if exists "chat_delete_admin" on chat_messages;
end $$;

-- Own users can soft-delete their own messages
create policy "chat_delete_own" on chat_messages
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can soft-delete any message
create policy "chat_delete_admin" on chat_messages
  for update
  using (exists (select 1 from users where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from users where id = auth.uid() and is_admin = true));
