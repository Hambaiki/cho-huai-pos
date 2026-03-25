alter table public.order_items
add column if not exists unit_cost numeric(12,2);

update public.order_items as oi
set unit_cost = p.cost_price
from public.products as p
where oi.product_id = p.id
  and oi.unit_cost is null;