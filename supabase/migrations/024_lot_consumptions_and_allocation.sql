-- lot_consumptions: records exactly which lots were consumed for each order item.
-- This gives a full FIFO/LIFO audit trail and the exact COGS per sale line.

create table if not exists public.lot_consumptions (
  id                 uuid primary key default gen_random_uuid(),
  lot_id             uuid not null references public.purchase_lots(id),
  order_item_id      uuid not null references public.order_items(id) on delete cascade,
  quantity           integer not null check (quantity > 0),
  unit_cost_snapshot numeric(12,2) not null,
  created_at         timestamptz not null default now()
);

create index if not exists lot_consumptions_order_item_idx
  on public.lot_consumptions (order_item_id);

create index if not exists lot_consumptions_lot_idx
  on public.lot_consumptions (lot_id);

-- RLS
alter table public.lot_consumptions enable row level security;

create policy "members can view lot consumptions"
  on public.lot_consumptions for select
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = lot_consumptions.order_item_id
        and public.get_my_role(o.store_id) is not null
    )
  );

create policy "system can insert lot consumptions"
  on public.lot_consumptions for insert
  with check (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = lot_consumptions.order_item_id
        and public.get_my_role(o.store_id) in ('owner', 'manager', 'cashier')
    )
  );

-- ─── Replace process_order_stock with lot-aware version ──────────────────────
-- Uses FIFO or LIFO from the store's cost_method setting.
-- For each order item, greedily consumes purchase_lots in the correct order,
-- inserts lot_consumption rows, decrements remaining_qty, and stores the
-- weighted average unit_cost back onto the order_item.
-- Falls back to direct stock decrement (no lot records) if the product has no lots,
-- so the transition from pre-lot data is safe.

create or replace function public.process_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost_method     text;
  item              record;
  lot               record;
  v_remaining       integer;
  v_consumed        integer;
  v_total_cost      numeric;
  v_unit_cost       numeric;
  v_has_lots        boolean;
begin
  -- Fetch store costing method
  select s.cost_method::text into v_cost_method
  from public.orders o
  join public.stores s on s.id = o.store_id
  where o.id = p_order_id;

  v_cost_method := coalesce(v_cost_method, 'fifo');

  -- Process each order item
  for item in
    select oi.id          as order_item_id,
           oi.product_id,
           oi.quantity,
           o.store_id
    from public.order_items oi
    join public.orders      o on o.id = oi.order_id
    where oi.order_id = p_order_id
      and oi.product_id is not null
  loop
    v_remaining  := item.quantity;
    v_total_cost := 0;

    -- Check whether this product has any purchase lots
    select exists(
      select 1 from public.purchase_lots
      where product_id = item.product_id
        and store_id    = item.store_id
        and remaining_qty > 0
    ) into v_has_lots;

    if v_has_lots then
      -- Consume lots in FIFO (received_at asc) or LIFO (received_at desc) order.
      -- The CASE trick lets a single query cover both orderings without duplication.
      for lot in
        select id, remaining_qty, unit_cost
        from public.purchase_lots
        where product_id   = item.product_id
          and store_id     = item.store_id
          and remaining_qty > 0
        order by
          case when v_cost_method = 'fifo' then received_at end asc  nulls last,
          case when v_cost_method = 'lifo' then received_at end desc nulls last
      loop
        exit when v_remaining = 0;

        v_consumed   := least(lot.remaining_qty, v_remaining);
        v_total_cost := v_total_cost + v_consumed * lot.unit_cost;
        v_remaining  := v_remaining - v_consumed;

        -- Insert consumption record
        insert into public.lot_consumptions
          (lot_id, order_item_id, quantity, unit_cost_snapshot)
        values
          (lot.id, item.order_item_id, v_consumed, lot.unit_cost);

        -- Decrement lot
        update public.purchase_lots
        set remaining_qty = remaining_qty - v_consumed
        where id = lot.id;
      end loop;

      -- Store weighted average cost on the order item
      if item.quantity > 0 then
        v_unit_cost := v_total_cost / item.quantity;
      else
        v_unit_cost := 0;
      end if;

      update public.order_items
      set unit_cost = v_unit_cost
      where id = item.order_item_id;
    end if;

    -- Always decrement product stock_qty (lot path and legacy path)
    update public.products
    set stock_qty  = stock_qty - item.quantity,
        updated_at = now()
    where id = item.product_id;
  end loop;
end;
$$;
