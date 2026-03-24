alter table profiles enable row level security;
alter table stores enable row level security;
alter table store_members enable row level security;
alter table invite_codes enable row level security;
alter table site_settings enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (id = auth.uid());

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "members can view stores"
  on stores for select
  using (public.get_my_role(id) is not null);

create policy "owners can create stores"
  on stores for insert
  with check (owner_id = auth.uid());

create policy "owners can update stores"
  on stores for update
  using (public.get_my_role(id) = 'owner');

create policy "members can view store members"
  on store_members for select
  using (public.get_my_role(store_id) is not null);

create policy "owner manager can insert members"
  on store_members for insert
  with check (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "owners can update members"
  on store_members for update
  using (public.get_my_role(store_id) = 'owner');

create policy "owners can delete members"
  on store_members for delete
  using (public.get_my_role(store_id) = 'owner');
