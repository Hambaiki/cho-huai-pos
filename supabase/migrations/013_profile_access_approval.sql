alter table profiles
  add column if not exists is_suspended boolean;

update profiles
set is_suspended = false
where is_suspended is null;

update profiles
set is_suspended = false
where is_super_admin = true;

alter table profiles
  alter column is_suspended set default true;

alter table profiles
  alter column is_suspended set not null;

create or replace function public.is_current_user_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_super_admin = true
  );
$$;

drop policy if exists "super admins can view all profiles" on profiles;
create policy "super admins can view all profiles"
  on profiles for select
  using (public.is_current_user_super_admin());

drop policy if exists "super admins can update all profiles" on profiles;
create policy "super admins can update all profiles"
  on profiles for update
  using (public.is_current_user_super_admin())
  with check (public.is_current_user_super_admin());
