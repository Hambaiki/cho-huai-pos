alter table public.store_promotions
  add column if not exists max_redemptions integer;

alter table public.store_promotions
  drop constraint if exists store_promotions_max_redemptions_check;

alter table public.store_promotions
  add constraint store_promotions_max_redemptions_check
  check (max_redemptions is null or max_redemptions > 0);
