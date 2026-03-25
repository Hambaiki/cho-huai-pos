-- QR Transfer Channels
create table qr_channels (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  label       text not null,
  image_url   text not null,
  is_enabled  boolean not null default true,
  sort_order  integer not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table qr_channels enable row level security;

create policy "members can view qr channels"
  on qr_channels for select
  using (get_my_role(store_id) is not null);

create policy "owner can manage qr channels"
  on qr_channels for all
  using (get_my_role(store_id) = 'owner');

-- Add QR payment tracking columns to orders
alter table orders
  add column if not exists qr_channel_id uuid references qr_channels(id) on delete set null,
  add column if not exists qr_reference  text;

-- Supabase Storage bucket for app assets (QR codes, product images, branding, etc.)
-- Path convention: stores/{storeId}/qr-channels/{timestamp}-{name}
-- Run in Supabase dashboard or linked project:
-- insert into storage.buckets (id, name, public) values ('app-assets', 'app-assets', true) on conflict do nothing;
