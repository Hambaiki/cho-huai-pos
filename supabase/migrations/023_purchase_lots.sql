-- Purchase lots: records each stock-in event with its unit cost.
-- remaining_qty tracks how many units are still unconsumed by sales.

create table if not exists public.purchase_lots (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  received_qty    integer not null check (received_qty > 0),
  remaining_qty   integer not null check (remaining_qty >= 0),
  unit_cost       numeric(12,2) not null default 0 check (unit_cost >= 0),
  source_ref      text,
  notes           text,
  received_at     timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

create index if not exists purchase_lots_product_fifo_idx
  on public.purchase_lots (product_id, received_at asc)
  where remaining_qty > 0;

create index if not exists purchase_lots_product_lifo_idx
  on public.purchase_lots (product_id, received_at desc)
  where remaining_qty > 0;

-- RLS
alter table public.purchase_lots enable row level security;

create policy "members can view purchase lots"
  on public.purchase_lots for select
  using (public.get_my_role(store_id) is not null);

create policy "managers can create purchase lots"
  on public.purchase_lots for insert
  with check (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "managers can update purchase lots"
  on public.purchase_lots for update
  using (public.get_my_role(store_id) in ('owner', 'manager'));
