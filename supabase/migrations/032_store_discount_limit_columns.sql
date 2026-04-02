alter table stores
  add column if not exists max_cashier_order_discount_amount numeric(12,2) not null default 300,
  add column if not exists max_cashier_order_discount_percentage numeric(5,2) not null default 10;

alter table stores
  add constraint stores_max_cashier_order_discount_amount_ck
  check (max_cashier_order_discount_amount >= 0);

alter table stores
  add constraint stores_max_cashier_order_discount_percentage_ck
  check (
    max_cashier_order_discount_percentage >= 0
    and max_cashier_order_discount_percentage <= 100
  );
