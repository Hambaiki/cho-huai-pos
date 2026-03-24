create policy "store owner can insert self as member"
  on store_members for insert
  with check (
    user_id = auth.uid() and
    exists (select 1 from stores where id = store_members.store_id and owner_id = auth.uid())
  );
