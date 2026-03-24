alter table orders
  add column if not exists voided_by uuid references auth.users(id) on delete set null,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text;