-- Add inventory costing method to stores (FIFO or LIFO, default FIFO)

create type inventory_cost_method as enum ('fifo', 'lifo');

alter table public.stores
  add column if not exists cost_method inventory_cost_method not null default 'fifo';
