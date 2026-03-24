insert into site_settings (key, value)
values
  ('maintenance_mode', 'false'),
  ('announcement_text', ''),
  ('default_staff_limit_per_store', '10'),
  ('default_store_limit_per_account', '3')
on conflict (key) do nothing;
