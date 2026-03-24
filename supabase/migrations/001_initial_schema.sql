create extension if not exists pgcrypto;

create type member_role as enum ('owner', 'manager', 'cashier', 'viewer');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_super_admin boolean not null default false,
  is_suspended boolean not null default true,
  is_provisioned boolean not null default false,
  store_limit_override integer,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  logo_url text,
  address text,
  currency_code text not null default 'THB',
  currency_symbol text not null default '฿',
  currency_decimals integer not null default 0,
  symbol_position text not null default 'prefix' check (symbol_position in ('prefix', 'suffix')),
  tax_rate numeric(5,2) not null default 0,
  receipt_header text,
  receipt_footer text,
  is_suspended boolean not null default false,
  staff_limit_override integer,
  created_at timestamptz not null default now()
);

create table if not exists store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'cashier',
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  created_by uuid references auth.users(id),
  note text,
  expires_at timestamptz,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.get_my_role(p_store_id uuid)
returns member_role
language sql
security definer
stable
set search_path = public
as $$
  select role
  from store_members
  where store_id = p_store_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
