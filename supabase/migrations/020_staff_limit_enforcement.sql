create or replace function public.invite_staff_by_email(
  p_store_id uuid,
  p_email text,
  p_role public.member_role,
  p_note text default null
)
returns table (
  status text,
  message text,
  invited_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.member_role;
  v_target_user_id uuid;
  v_staff_limit integer;
  v_current_staff_count integer;
begin
  if v_actor_id is null then
    return query select 'error', 'Authentication required.', null::uuid;
    return;
  end if;

  select sm.role
  into v_actor_role
  from public.store_members sm
  where sm.store_id = p_store_id
    and sm.user_id = v_actor_id
  limit 1;

  if v_actor_role is null then
    return query select 'error', 'You do not have access to this store.', null::uuid;
    return;
  end if;

  if v_actor_role not in ('owner', 'manager') then
    return query select 'error', 'Only store owners or managers can invite staff.', null::uuid;
    return;
  end if;

  if p_role = 'owner' then
    return query select 'error', 'Cannot assign owner role via invite.', null::uuid;
    return;
  end if;

  select coalesce(
    s.staff_limit_override,
    (
      select case
        when ss.value ~ '^[0-9]+$' then ss.value::integer
        else null
      end
      from public.site_settings ss
      where ss.key = 'default_staff_limit_per_store'
      limit 1
    ),
    10
  )
  into v_staff_limit
  from public.stores s
  where s.id = p_store_id
  limit 1;

  if coalesce(v_staff_limit, 0) < 1 then
    v_staff_limit := 1;
  end if;

  select count(*)
  into v_current_staff_count
  from public.store_members sm
  where sm.store_id = p_store_id;

  if v_current_staff_count >= v_staff_limit then
    return query
      select
        'error',
        format('Staff limit reached for this store (%s members).', v_staff_limit),
        null::uuid;
    return;
  end if;

  select u.id
  into v_target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_target_user_id is null then
    return query select 'error', 'No account found for that email. Ask them to sign up first.', null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.store_members sm
    where sm.store_id = p_store_id
      and sm.user_id = v_target_user_id
  ) then
    return query select 'exists', 'This user is already a member of this store.', v_target_user_id;
    return;
  end if;

  insert into public.store_members (store_id, user_id, role, invited_by)
  values (p_store_id, v_target_user_id, p_role, v_actor_id)
  on conflict (store_id, user_id) do nothing;

  return query select 'invited', 'Staff member added to the store.', v_target_user_id;
end;
$$;

grant execute on function public.invite_staff_by_email(uuid, text, public.member_role, text) to authenticated;
