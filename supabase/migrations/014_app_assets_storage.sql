-- Storage RLS policies for the app-assets bucket.
-- IMPORTANT: The bucket MUST be created as public (public: true) for getPublicUrl() to work.
-- Create it in the Supabase dashboard: Storage → New bucket → name: app-assets → toggle Public ON
--
-- Path conventions used:
--   stores/{storeId}/qr-channels/{timestamp}-{filename}
--   stores/{storeId}/products/{timestamp}-{filename}
--   stores/{storeId}/branding/{filename}

-- Allow anyone (including unauthenticated visitors on the POS) to read public assets.
-- This is required even on public buckets when the bucket has any other RLS policies set.
create policy "public can read app assets"
  on storage.objects for select
  to public
  using (bucket_id = 'app-assets');

-- Allow store owners to upload files under their own store path.
create policy "store owners can upload assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'app-assets'
    and (storage.foldername(name))[1] = 'stores'
    and get_my_role((storage.foldername(name))[2]::uuid) = 'owner'
  );

-- Allow store owners to delete their own store files (e.g. cleanup on channel delete).
create policy "store owners can delete assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'app-assets'
    and (storage.foldername(name))[1] = 'stores'
    and get_my_role((storage.foldername(name))[2]::uuid) = 'owner'
  );

-- Allow store members to update (replace) files under their store path.
create policy "store owners can update assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'app-assets'
    and (storage.foldername(name))[1] = 'stores'
    and get_my_role((storage.foldername(name))[2]::uuid) = 'owner'
  );
