-- Allow anyone (including unauthenticated) to read files from the app-assets bucket.
-- This is necessary for getPublicUrl() links to work (QR images, product photos, etc.)
-- even when other RLS policies exist on the bucket.
--
-- NOTE: The bucket itself must also be set to public in the Supabase dashboard:
--   Storage → app-assets → Edit → toggle "Public bucket" ON
create policy "public can read app assets"
  on storage.objects for select
  to public
  using (bucket_id = 'app-assets');
