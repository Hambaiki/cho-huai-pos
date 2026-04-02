insert into site_settings (key, value)
values
  ('max_cashier_order_discount_amount', '300'),
  ('max_cashier_order_discount_percentage', '10')
on conflict (key) do nothing;
