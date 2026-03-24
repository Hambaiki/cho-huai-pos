alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_adjustments enable row level security;

create policy "members can view categories"
  on categories for select
  using (public.get_my_role(store_id) is not null);

create policy "manager can manage categories"
  on categories for all
  using (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "members can view products"
  on products for select
  using (public.get_my_role(store_id) is not null);

create policy "manager can manage products"
  on products for all
  using (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "members can view orders"
  on orders for select
  using (public.get_my_role(store_id) is not null);

create policy "cashier can create orders"
  on orders for insert
  with check (public.get_my_role(store_id) in ('owner', 'manager', 'cashier'));

create policy "manager can update orders"
  on orders for update
  using (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "members can view order items"
  on order_items for select
  using (
    exists (
      select 1
      from orders o
      where o.id = order_items.order_id
      and public.get_my_role(o.store_id) is not null
    )
  );

create policy "cashier can create order items"
  on order_items for insert
  with check (
    exists (
      select 1
      from orders o
      where o.id = order_items.order_id
      and public.get_my_role(o.store_id) in ('owner', 'manager', 'cashier')
    )
  );

create policy "manager can view stock adjustments"
  on stock_adjustments for select
  using (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "manager can create stock adjustments"
  on stock_adjustments for insert
  with check (public.get_my_role(store_id) in ('owner', 'manager'));
