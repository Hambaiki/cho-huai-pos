create or replace function public.paginated_products(
  p_store_id uuid,
  p_query text default null,
  p_statuses text[] default null,
  p_stock_statuses text[] default null,
  p_page integer default 1,
  p_page_size integer default 10
)
returns table (
  id uuid,
  name text,
  sku text,
  barcode text,
  price numeric,
  cost_price numeric,
  stock_qty integer,
  low_stock_at integer,
  unit text,
  is_active boolean,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  with filtered as (
    select p.*
    from public.products p
    where p.store_id = p_store_id
      and (
        p_query is null
        or p_query = ''
        or p.name ilike '%' || p_query || '%'
        or coalesce(p.sku, '') ilike '%' || p_query || '%'
        or coalesce(p.barcode, '') ilike '%' || p_query || '%'
      )
      and (
        p_statuses is null
        or cardinality(p_statuses) = 0
        or (case when p.is_active then 'active' else 'inactive' end) = any(p_statuses)
      )
      and (
        p_stock_statuses is null
        or cardinality(p_stock_statuses) = 0
        or (
          ('out_of_stock' = any(p_stock_statuses) and p.stock_qty = 0)
          or ('low_stock' = any(p_stock_statuses) and p.stock_qty > 0 and p.stock_qty <= p.low_stock_at)
          or ('in_stock' = any(p_stock_statuses) and p.stock_qty > p.low_stock_at)
        )
      )
  )
  select
    filtered.id,
    filtered.name,
    filtered.sku,
    filtered.barcode,
    filtered.price,
    filtered.cost_price,
    filtered.stock_qty,
    filtered.low_stock_at,
    filtered.unit,
    filtered.is_active,
    count(*) over() as total_count
  from filtered
  order by filtered.name asc, filtered.id asc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;

create or replace function public.paginated_orders(
  p_store_id uuid,
  p_query text default null,
  p_statuses text[] default null,
  p_methods text[] default null,
  p_page integer default 1,
  p_page_size integer default 10
)
returns table (
  id uuid,
  total numeric,
  payment_method public.payment_method,
  status public.order_status,
  created_at timestamptz,
  cashier_id uuid,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  with filtered as (
    select o.*
    from public.orders o
    where o.store_id = p_store_id
      and (
        p_query is null
        or p_query = ''
        or o.id::text ilike '%' || p_query || '%'
        or o.total::text ilike '%' || p_query || '%'
      )
      and (
        p_statuses is null
        or cardinality(p_statuses) = 0
        or o.status::text = any(p_statuses)
      )
      and (
        p_methods is null
        or cardinality(p_methods) = 0
        or o.payment_method::text = any(p_methods)
      )
  )
  select
    filtered.id,
    filtered.total,
    filtered.payment_method,
    filtered.status,
    filtered.created_at,
    filtered.cashier_id,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id desc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;

create or replace function public.paginated_bnpl_accounts(
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
  phone text,
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
    filtered.customer_phone as phone,
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