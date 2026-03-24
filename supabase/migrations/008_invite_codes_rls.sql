create policy "anyone can read invite codes for validation"
  on invite_codes for select
  using (true);

create policy "only super admins can modify invite codes"
  on invite_codes for update
  using (false);

create policy "only super admins can delete invite codes"
  on invite_codes for delete
  using (false);
