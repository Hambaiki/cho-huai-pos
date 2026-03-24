create policy "owners can view own stores"
  on stores for select
  using (owner_id = auth.uid());
