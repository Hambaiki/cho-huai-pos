do $$ begin
  create type promotion_type as enum ('fixed_amount', 'percentage');
exception
  when duplicate_object then null;
end $$;

create table if not exists store_promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  code text,
  type promotion_type not null,
  value numeric(12,2) not null check (value >= 0),
  min_order_total numeric(12,2) not null default 0 check (min_order_total >= 0),
  max_discount_amount numeric(12,2) check (max_discount_amount is null or max_discount_amount >= 0),
  applies_automatically boolean not null default false,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_promotions_manual_or_auto_ck check (
    (applies_automatically = true and code is null)
    or (applies_automatically = false and code is not null)
  ),
  constraint store_promotions_date_window_ck check (
    ends_at is null or starts_at is null or ends_at >= starts_at
  ),
  constraint store_promotions_percentage_ck check (
    type <> 'percentage' or value <= 100
  )
);

create unique index if not exists store_promotions_store_code_uniq
  on store_promotions (store_id, code)
  where code is not null;

create index if not exists store_promotions_store_active_idx
  on store_promotions (store_id, is_active, applies_automatically);

create table if not exists promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references store_promotions(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  discount_amount numeric(12,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  unique (promotion_id, order_id)
);

create index if not exists promotion_redemptions_order_id_idx
  on promotion_redemptions (order_id);

alter table store_promotions enable row level security;
alter table promotion_redemptions enable row level security;

create policy "members can view store promotions"
  on store_promotions for select
  using (public.get_my_role(store_id) is not null);

create policy "manager can manage store promotions"
  on store_promotions for all
  using (public.get_my_role(store_id) in ('owner', 'manager'));

create policy "members can view promotion redemptions"
  on promotion_redemptions for select
  using (
    exists (
      select 1
      from store_promotions sp
      where sp.id = promotion_redemptions.promotion_id
      and public.get_my_role(sp.store_id) is not null
    )
  );

create policy "cashier can create promotion redemptions"
  on promotion_redemptions for insert
  with check (
    exists (
      select 1
      from orders o
      join store_promotions sp on sp.id = promotion_redemptions.promotion_id
      where o.id = promotion_redemptions.order_id
      and o.store_id = sp.store_id
      and public.get_my_role(o.store_id) in ('owner', 'manager', 'cashier')
    )
  );
