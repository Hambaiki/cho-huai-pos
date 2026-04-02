drop policy if exists "super admins can view all stores" on stores;
create policy "super admins can view all stores"
  on stores for select
  using (public.is_current_user_super_admin());
