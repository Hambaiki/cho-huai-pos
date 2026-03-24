create type payment_method as enum ('cash', 'qr_transfer', 'card', 'split', 'bnpl');
create type order_status as enum ('completed', 'voided', 'refunded');
create type adjustment_reason as enum ('purchase', 'return', 'damage', 'loss', 'correction', 'initial');

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  sku text,
  barcode text,
  price numeric(12,2) not null,
  cost_price numeric(12,2),
  stock_qty integer not null default 0,
  low_stock_at integer not null default 5,
  unit text not null default 'pc',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  cashier_id uuid references auth.users(id),
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  amount_tendered numeric(12,2),
  change_amount numeric(12,2),
  payment_method payment_method not null,
  status order_status not null default 'completed',
  notes text,
  qr_reference text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  discount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null
);

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id),
  adjusted_by uuid references auth.users(id),
  quantity integer not null,
  reason adjustment_reason not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.process_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select product_id, quantity
    from order_items
    where order_id = p_order_id and product_id is not null
  loop
    update products
    set stock_qty = stock_qty - item.quantity,
        updated_at = now()
    where id = item.product_id;
  end loop;
end;
$$;
