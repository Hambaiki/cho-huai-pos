-- Backfill existing products into purchase_lots so the lot-based allocation
-- works for all products that had stock before this feature was introduced.
-- Uses cost_price as unit_cost; falls back to 0 if cost_price is null.
-- Tagged with source_ref = 'initial-balance' for auditability.

insert into public.purchase_lots
  (store_id, product_id, received_qty, remaining_qty, unit_cost, source_ref, received_at)
select
  p.store_id,
  p.id,
  p.stock_qty,
  p.stock_qty,
  coalesce(p.cost_price, 0),
  'initial-balance',
  p.created_at
from public.products p
where p.stock_qty > 0;
