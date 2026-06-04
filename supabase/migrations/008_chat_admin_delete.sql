-- Fix chat delete: allow admins to soft-delete any message, own users to delete own
do $$
begin
  drop policy if exists "chat_delete_own" on chat_messages;
  drop policy if exists "chat_delete_admin" on chat_messages;
end $$;

-- Own messages
create policy "chat_delete_own" on chat_messages
  for update using (auth.uid() = user_id);

-- Admins can delete any message
create policy "chat_delete_admin" on chat_messages
  for update using (
    exists (select 1 from users where id = auth.uid() and is_admin = true)
  );
