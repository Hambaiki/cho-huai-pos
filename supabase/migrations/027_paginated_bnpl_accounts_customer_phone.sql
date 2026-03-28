drop function if exists public.paginated_bnpl_accounts(
  uuid,
  text,
  text[],
  text[],
  integer,
  integer
);

create function public.paginated_bnpl_accounts(
  p_store_id uuid,
  p_query text default null,
  p_statuses text[] default null,
  p_balance_statuses text[] default null,
  p_page integer default 1,
  p_page_size integer default 10
)
returns table (
  id uuid,
  customer_name text,
  customer_phone text,
  credit_limit numeric,
  balance_due numeric,
  status text,
  notes text,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  with filtered as (
    select a.*
    from public.bnpl_accounts a
    where a.store_id = p_store_id
      and (
        p_query is null
        or p_query = ''
        or a.customer_name ilike '%' || p_query || '%'
        or coalesce(a.customer_phone, '') ilike '%' || p_query || '%'
      )
      and (
        p_statuses is null
        or cardinality(p_statuses) = 0
        or a.status::text = any(p_statuses)
      )
      and (
        p_balance_statuses is null
        or cardinality(p_balance_statuses) = 0
        or (
          ('has_balance' = any(p_balance_statuses) and a.balance_due > 0)
          or ('no_balance' = any(p_balance_statuses) and a.balance_due = 0)
        )
      )
  )
  select
    filtered.id,
    filtered.customer_name,
    filtered.customer_phone,
    filtered.credit_limit,
    filtered.balance_due,
    filtered.status,
    filtered.notes,
    filtered.created_at,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id desc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;
