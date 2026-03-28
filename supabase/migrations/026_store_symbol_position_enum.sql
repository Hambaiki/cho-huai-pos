-- Convert stores.symbol_position from text+check to a proper enum so generated types
-- become strict ('prefix' | 'suffix') instead of plain string.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'currency_symbol_position'
      and n.nspname = 'public'
  ) then
    create type public.currency_symbol_position as enum ('prefix', 'suffix');
  end if;
end
$$;

-- Drop old text-based check before changing the column type.
alter table public.stores
  drop constraint if exists stores_symbol_position_check;

alter table public.stores
  alter column symbol_position drop default;

alter table public.stores
  alter column symbol_position type public.currency_symbol_position
  using symbol_position::public.currency_symbol_position;

alter table public.stores
  alter column symbol_position set default 'prefix'::public.currency_symbol_position;
