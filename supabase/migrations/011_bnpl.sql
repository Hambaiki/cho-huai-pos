-- BNPL (Buy Now Pay Later) schema

create type bnpl_account_status as enum ('active', 'frozen', 'closed', 'settled');
create type installment_status as enum ('pending', 'paid', 'waived');

-- Customer credit accounts
create table bnpl_accounts (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  credit_limit  numeric(12,2) not null default 0,
  balance_due   numeric(12,2) not null default 0,
  status        bnpl_account_status not null default 'active',
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table bnpl_accounts enable row level security;

create policy "members can view bnpl accounts"
  on bnpl_accounts for select
  using (get_my_role(store_id) is not null);

create policy "manager+ can manage bnpl accounts"
  on bnpl_accounts for all
  using (get_my_role(store_id) in ('owner', 'manager'));

-- Installment schedules
create table bnpl_installments (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references bnpl_accounts(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  amount      numeric(12,2) not null,
  due_date    date not null,
  status      installment_status not null default 'pending',
  -- 'overdue' is derived on the frontend: status = 'pending' AND due_date < today
  notes       text,
  created_at  timestamptz default now()
);

alter table bnpl_installments enable row level security;

create policy "members can view bnpl installments"
  on bnpl_installments for select
  using (
    get_my_role((select store_id from bnpl_accounts where id = account_id)) is not null
  );

create policy "manager+ can manage bnpl installments"
  on bnpl_installments for all
  using (
    get_my_role((select store_id from bnpl_accounts where id = account_id)) in ('owner', 'manager')
  );

-- Payments received against installments
create table bnpl_payments (
  id              uuid primary key default gen_random_uuid(),
  installment_id  uuid not null references bnpl_installments(id) on delete cascade,
  account_id      uuid not null references bnpl_accounts(id),
  amount_paid     numeric(12,2) not null,
  received_by     uuid references auth.users(id),
  payment_method  payment_method,
  notes           text,
  paid_at         timestamptz default now()
);

alter table bnpl_payments enable row level security;

create policy "members can view bnpl payments"
  on bnpl_payments for select
  using (
    get_my_role((select store_id from bnpl_accounts where id = account_id)) is not null
  );

create policy "manager+ can manage bnpl payments"
  on bnpl_payments for all
  using (
    get_my_role((select store_id from bnpl_accounts where id = account_id)) in ('owner', 'manager')
  );

-- Trigger: update bnpl_accounts.balance_due and mark installment paid when a payment is inserted
create or replace function update_bnpl_balance_on_payment()
returns trigger as $$
begin
  -- Decrement balance_due
  update bnpl_accounts
  set balance_due = greatest(0, balance_due - NEW.amount_paid),
      updated_at  = now()
  where id = NEW.account_id;

  -- Mark installment as paid if fully covered
  update bnpl_installments
  set status = 'paid'
  where id = NEW.installment_id
    and amount <= (
      select coalesce(sum(amount_paid), 0)
      from bnpl_payments
      where installment_id = NEW.installment_id
    );

  return NEW;
end;
$$ language plpgsql security definer;

create trigger bnpl_payment_inserted
  after insert on bnpl_payments
  for each row execute function update_bnpl_balance_on_payment();

-- Add bnpl_account_id to orders to link an order to a credit account
alter table orders
  add column if not exists bnpl_account_id uuid references bnpl_accounts(id) on delete set null;
