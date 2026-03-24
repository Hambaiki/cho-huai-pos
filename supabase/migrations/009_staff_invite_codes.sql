-- Extend invite_codes table to support staff invitations
-- Add optional store_id and role for staff-specific codes
-- Account owner codes: store_id = NULL, role = NULL
-- Staff codes: store_id = target store, role = assigned role

alter table invite_codes
add column store_id uuid,
add column role member_role,
add constraint fk_invite_store foreign key (store_id) references stores(id) on delete cascade;

-- Create index for faster lookup
create index idx_invite_codes_store_role on invite_codes(store_id, role) where store_id is not null;
