drop function if exists public.paginated_products(
  uuid,
  text,
  text[],
  text[],
  uuid[],
  integer,
  integer
);

create or replace function public.paginated_products(
  p_store_id uuid,
  p_query text default null,
  p_statuses text[] default null,
  p_stock_statuses text[] default null,
  p_category_ids uuid[] default null,
  p_page integer default 1,
  p_page_size integer default 10
)
returns table (
  id uuid,
  name text,
  sku text,
  barcode text,
  image_url text,
  price numeric,
  cost_price numeric,
  stock_qty integer,
  low_stock_at integer,
  unit text,
  is_active boolean,
  category_id uuid,
  category_name text,
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
      and (
        p_category_ids is null
        or cardinality(p_category_ids) = 0
        or p.category_id = any(p_category_ids)
      )
  )
  select
    filtered.id,
    filtered.name,
    filtered.sku,
    filtered.barcode,
    filtered.image_url,
    filtered.price,
    filtered.cost_price,
    filtered.stock_qty,
    filtered.low_stock_at,
    filtered.unit,
    filtered.is_active,
    filtered.category_id,
    c.name as category_name,
    count(*) over() as total_count
  from filtered
  left join public.categories c on c.id = filtered.category_id
  order by filtered.name asc, filtered.id asc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;
