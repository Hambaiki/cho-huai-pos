# CHO-HUAI POS — Project Planning Document

> **Stack:** Next.js 16 · Tailwind CSS v4 · Supabase  
> **Purpose:** Simple point-of-sale for small stores with team access and a built-in Buy Now Pay Later (BNPL) system.  
> **Default locale:** Thailand · THB (฿) — per-store currency is fully customisable  
> **Last updated:** 2026-03-23 (rev 3 — renamed to CHO-HUAI POS, Thai context, per-store currency settings)
> **Rev 4:** Removed Supabase Edge Functions and `installment_status` DB column — overdue state is calculated on the frontend from `due_date`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Modules](#2-core-modules)
3. [Tech Stack & Tooling](#3-tech-stack--tooling)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [Row Level Security (RLS) Strategy](#6-row-level-security-rls-strategy)
7. [Authentication & Multi-Tenancy](#7-authentication--multi-tenancy)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [POS Terminal](#9-pos-terminal)
10. [Inventory Management](#10-inventory-management)
11. [BNPL System](#11-bnpl-system)
12. [QR Transfer Payment](#12-qr-transfer-payment)
13. [Team Management](#13-team-management)
14. [Reports](#14-reports)
15. [App Router — Pages & Routes](#15-app-router--pages--routes)
16. [API Routes (Server Actions / Route Handlers)](#16-api-routes-server-actions--route-handlers)
17. [State Management](#17-state-management)
18. [Key UI Components](#18-key-ui-components)
19. [Environment Variables](#19-environment-variables)
20. [Development Conventions](#20-development-conventions)
21. [Milestones & Build Order](#21-milestones--build-order)

---

## 1. Project Overview

CHO-HUAI POS is a lightweight, web-based point-of-sale system designed for small retail stores (convenience stores, boutiques, food stalls, market vendors, etc.). The product is opinionated and focused — it does not try to compete with enterprise POS systems. Its primary market is Thailand, with THB (฿) as the default currency and 0 decimal places, but every store independently configures its own currency to support multi-currency operation. Its key differentiators are:

- **Simplicity first** — any store owner should be able to set up and start selling within minutes.
- **Team access** — additional staff can be invited with scoped permissions (owner, manager, cashier, viewer).
- **Built-in BNPL** — stores can manage their own informal credit / installment system for trusted customers, entirely within the app. No third-party fintech integration required.
- **QR Transfer payment** — store owners upload a static QR code image (PromptPay, TrueMoney, bank QR, etc.) per payment channel. At checkout the POS displays the QR with the exact amount overlaid, so the customer scans and pays the correct amount without the cashier typing anything. Zero API integration, zero transaction fees.
- **Per-store currency** — each store sets its own currency code (ISO 4217), display symbol, and decimal precision independently. Default is THB / ฿ / 0 decimals; any store can override this (e.g. USD / $ / 2 decimals for a foreign-owned shop).

### Target Users

| User        | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| Store Owner | Sets up the store, manages products, views all reports, controls BNPL accounts |
| Manager     | Day-to-day operations, can void orders, manage inventory and BNPL              |
| Cashier     | Operates the POS terminal, records BNPL payments (if permitted)                |
| Viewer      | Read-only access to reports (e.g. silent business partner)                     |

---

## 2. Core Modules

### 2.1 Store Setup

- Create a store with name, logo, address, and tax rate
- **Currency settings** — each store independently sets: ISO currency code (default `THB`), display symbol (default `฿`), decimal places (default `0`), and symbol position (prefix/suffix). These settings flow through all price displays, receipts, and the QR amount overlay.
- Receipt customization (header message, footer note, show/hide tax line)
- One user can own multiple stores (store switcher in nav)
- **QR Transfer channels** — upload and label one or more QR code images (e.g. "PromptPay", "TrueMoney", "KBank"). Each channel can be enabled or disabled independently.

### 2.2 POS Terminal

- Full-screen sales interface optimized for speed
- Product search by name or SKU; optional barcode via keyboard wedge or camera
- Cart with quantity adjustment, item-level discount, and order-level discount
- Payment: cash (with change computation), QR transfer, card, split payment, or BNPL
- **QR Transfer checkout** — when selected, the POS displays the store's QR code image with the exact order total overlaid prominently. Cashier confirms once the customer shows their payment confirmation screen.
- Receipt generation: thermal-print-ready HTML, digital receipt via SMS/email

### 2.3 Inventory Management

- Product catalog with name, SKU, barcode, price, cost price, category, image, and unit of measure
- Stock quantity tracking; auto-decrement on sale
- Low-stock threshold per product; dashboard alert when breached
- Manual stock adjustments with reason codes and audit trail
- Categories for grouping and filtering

### 2.4 Team Management

- Invite staff via email; invite token consumed on sign-up or sign-in
- Assign roles (owner / manager / cashier / viewer) per store
- Remove or change role at any time (owner only for sensitive changes)
- Activity log per member (orders processed, voids, stock adjustments)

### 2.5 BNPL System _(key differentiator)_

- Store-managed customer credit accounts (not a third-party service)
- Credit limit per customer account
- Installment scheduling with due dates
- Payment recording against installments
- Overdue detection calculated on the frontend from `due_date` — no backend scheduler needed
- Account freeze / close capability

### 2.6 QR Transfer Payment _(key differentiator)_

- Owner uploads one or more static QR code images in Settings (PromptPay, TrueMoney, KBank, SCB, etc.)
- Each QR channel has a label, an image, and an enabled/disabled toggle
- At checkout, if the cashier selects QR Transfer, they choose the channel and the POS renders a fullscreen display showing:
  - The QR code image (large, scannable by the customer's phone)
  - The exact amount to pay, overlaid prominently below the QR
  - The channel label (e.g. "PromptPay — scan to pay")
- No API calls, no webhooks — payment confirmation is manual (cashier taps "Confirm received")
- The reference number field is optional but recommended for reconciliation
- Works for any QR standard (Thai QR standard, proprietary e-wallet QR, etc.) since it is purely image-based

### 2.7 Reports

- Daily / weekly / monthly sales summary
- Best-selling products
- Payment method breakdown (including QR Transfer per channel)
- BNPL receivables (total outstanding per account, overdue list)
- Staff performance (orders per cashier, voids)

---

## 3. Tech Stack & Tooling

| Layer         | Choice                | Notes                                          |
| ------------- | --------------------- | ---------------------------------------------- |
| Framework     | Next.js 16            | App Router, Server & Client Components         |
| Styling       | Tailwind CSS v4       | CSS-first config via `@theme` in `globals.css` |
| Database      | Supabase (Postgres)   | RLS for multi-tenant isolation                 |
| Auth          | Supabase Auth         | Email/password; optionally Google OAuth        |
| Storage       | Supabase Storage      | Product images bucket; QR code images bucket   |
| State         | Zustand               | Cart state for POS terminal                    |
| Forms         | react-hook-form + zod | Validation on all forms                        |
| Date handling | date-fns              | Installment due-date calculations              |
| Charts        | Recharts              | Reports dashboard                              |
| Notifications | react-hot-toast       | In-app feedback                                |
| ORM / query   | Supabase JS client v2 | `@supabase/ssr` for server-side usage          |

### Key Packages

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "zustand": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "recharts": "^2.x",
    "react-hot-toast": "^2.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "class-variance-authority": "^0.x",
    "tailwind-merge": "^2.x",
    "clsx": "^2.x"
  }
}
```

---

## 4. Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (store)/                        # Auth-gated group
│   │   ├── layout.tsx                  # Store context provider, nav shell
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── pos/
│   │   │   └── page.tsx                # Client Component (full interactivity)
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── bnpl/
│   │   │   ├── page.tsx                # Account list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Account detail + installments
│   │   │       └── payment/page.tsx    # Record payment
│   │   ├── team/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── qr-channels/
│   │           └── page.tsx                # Manage QR transfer channels
│   ├── api/
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/void/route.ts
│   │   ├── bnpl/accounts/route.ts
│   │   ├── bnpl/payments/route.ts
│   │   └── team/invite/route.ts
│   ├── layout.tsx
│   └── globals.css                     # Tailwind v4 @theme config
│
├── components/
│   ├── pos/
│   │   ├── ProductGrid.tsx
│   │   ├── CartPanel.tsx
│   │   ├── CartItem.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── QrPaymentScreen.tsx         # Fullscreen QR display during checkout
│   │   ├── ReceiptModal.tsx
│   │   └── BarcodeInput.tsx
│   ├── bnpl/
│   │   ├── AccountCard.tsx
│   │   ├── InstallmentRow.tsx
│   │   ├── PaymentForm.tsx
│   │   └── AccountStatusBadge.tsx
│   ├── inventory/
│   │   ├── ProductForm.tsx
│   │   ├── StockAdjustModal.tsx
│   │   └── LowStockAlert.tsx
│   ├── reports/
│   │   ├── SalesSummaryChart.tsx
│   │   ├── BnplReceivablesTable.tsx
│   │   └── TopProductsChart.tsx
│   ├── settings/
│   │   ├── QrChannelForm.tsx            # Upload + label a QR channel
│   │   └── QrChannelCard.tsx            # Display card with enable/disable toggle
│   └── ui/                             # Shared primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Table.tsx
│       └── Avatar.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server component client
│   │   └── middleware.ts               # Session refresh
│   ├── store/
│   │   └── cart.ts                     # Zustand cart store
│   ├── validations/
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── bnpl.ts
│   └── utils/
│       ├── currency.ts                  # formatCurrency(amount, store) — respects per-store settings
│       ├── receipt.ts
│       ├── qr.ts                        # QR display helpers (amount formatting, image URL resolution)
│       └── permissions.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_functions_triggers.sql
│
├── middleware.ts                        # Next.js middleware for auth
├── .env.local
└── next.config.ts
```

---

## 5. Database Schema

### 5.1 users _(managed by Supabase Auth — `auth.users`)_

Extended via a `profiles` table for display name and avatar.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now()
);
```

### 5.2 stores

```sql
create table stores (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id),
  name              text not null,
  logo_url          text,
  address           text,
  -- Currency settings (fully customisable per store)
  currency_code     text not null default 'THB',    -- ISO 4217 code, e.g. 'THB', 'USD', 'EUR'
  currency_symbol   text not null default '฿',      -- display symbol, e.g. '฿', '$', '€'
  currency_decimals integer not null default 0,     -- decimal places; THB = 0, USD = 2
  symbol_position   text not null default 'prefix', -- 'prefix' or 'suffix'
  tax_rate          numeric(5,2) not null default 0,
  receipt_header    text,
  receipt_footer    text,
  created_at        timestamptz default now()
);
```

> **Currency note for AI coding assistants:** Never hardcode `฿` or `THB` in components. Always read `store.currency_symbol`, `store.currency_code`, and `store.currency_decimals` from the store context and pass them down. Use a shared `formatCurrency(amount, store)` utility (see `lib/utils/currency.ts`) for all price rendering — POS terminal, receipts, BNPL screens, and QR amount overlay.

### 5.3 store_members

```sql
create type member_role as enum ('owner', 'manager', 'cashier', 'viewer');

create table store_members (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        member_role not null default 'cashier',
  invited_by  uuid references auth.users(id),
  joined_at   timestamptz default now(),
  unique(store_id, user_id)
);
```

### 5.4 categories

```sql
create table categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  name        text not null,
  sort_order  integer default 0
);
```

### 5.5 products

```sql
create table products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  name          text not null,
  sku           text,
  barcode       text,
  price         numeric(12,2) not null,
  cost_price    numeric(12,2),
  stock_qty     integer not null default 0,
  low_stock_at  integer not null default 5,
  unit          text default 'pc',
  image_url     text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### 5.6 stock_adjustments

```sql
create type adjustment_reason as enum (
  'purchase', 'return', 'damage', 'loss', 'correction', 'initial'
);

create table stock_adjustments (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  product_id  uuid not null references products(id),
  adjusted_by uuid references auth.users(id),
  quantity    integer not null,           -- positive = stock in, negative = stock out
  reason      adjustment_reason not null,
  notes       text,
  created_at  timestamptz default now()
);
```

### 5.7 customers

```sql
create table customers (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  name        text not null,
  phone       text,
  notes       text,
  created_at  timestamptz default now()
);
```

### 5.8 orders

```sql
create type payment_method as enum (
  'cash', 'qr_transfer', 'card', 'split', 'bnpl'
);

create type order_status as enum (
  'completed', 'voided', 'refunded'
);

create table orders (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  cashier_id      uuid references auth.users(id),
  customer_id     uuid references customers(id),
  bnpl_account_id uuid references bnpl_accounts(id),
  subtotal        numeric(12,2) not null,
  discount        numeric(12,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null,
  amount_tendered numeric(12,2),
  change_amount   numeric(12,2),
  payment_method  payment_method not null,
  status          order_status not null default 'completed',
  voided_by       uuid references auth.users(id),
  voided_at       timestamptz,
  void_reason     text,
  notes           text,
  created_at      timestamptz default now()
);
```

### 5.9 order_items

```sql
create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  product_name text not null,            -- denormalized snapshot at time of sale
  unit_price  numeric(12,2) not null,
  quantity    integer not null,
  discount    numeric(12,2) not null default 0,
  subtotal    numeric(12,2) not null
);
```

### 5.10 bnpl_accounts

```sql
create type bnpl_account_status as enum ('active', 'frozen', 'closed', 'settled');

create table bnpl_accounts (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  customer_id   uuid references customers(id),
  customer_name text not null,           -- denormalized for quick display
  credit_limit  numeric(12,2) not null,
  balance_due   numeric(12,2) not null default 0,
  status        bnpl_account_status not null default 'active',
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### 5.11 bnpl_installments

```sql
create type installment_status as enum ('pending', 'paid', 'waived');
-- Note: 'overdue' is intentionally excluded — it is derived on the frontend
-- by comparing due_date to today's date. No backend scheduler required.

create table bnpl_installments (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references bnpl_accounts(id) on delete cascade,
  order_id    uuid references orders(id),
  amount      numeric(12,2) not null,
  due_date    date not null,
  status      installment_status not null default 'pending',
  -- Overdue is NOT stored. Derive it in the frontend:
  -- const isOverdue = (i) => i.status === 'pending' && new Date(i.due_date) < new Date()
  notes       text,
  created_at  timestamptz default now()
);
```

### 5.12 bnpl_payments

```sql
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
```

### 5.13 qr_channels

Stores the owner-uploaded QR code images and their display configuration. Each row represents one payment channel (e.g. PromptPay, TrueMoney, KBank).

```sql
create table qr_channels (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  label       text not null,             -- e.g. "PromptPay", "TrueMoney", "KBank"
  image_url   text not null,             -- Supabase Storage public URL
  is_enabled  boolean not null default true,
  sort_order  integer not null default 0,-- display order in the payment channel picker
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

**Storage bucket:** `qr-codes` (public read, authenticated write, scoped by store via RLS on the table).  
**Image constraints (enforced client-side):** JPEG or PNG, max 5 MB, recommended minimum 400×400 px for reliable scannability on customer phones.

### 5.14 invites

```sql
create type invite_status as enum ('pending', 'accepted', 'expired');

create table invites (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  email       text not null,
  role        member_role not null default 'cashier',
  token       text not null unique,
  invited_by  uuid references auth.users(id),
  status      invite_status not null default 'pending',
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);
```

---

## 6. Row Level Security (RLS) Strategy

All tables are scoped to a `store_id`. RLS policies verify that the authenticated user is a member of the relevant store before allowing reads or writes.

### Helper function

```sql
-- Returns the role of the current user in a given store, or null if not a member
create or replace function get_my_role(p_store_id uuid)
returns member_role as $$
  select role from store_members
  where store_id = p_store_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;
```

### Example policies

```sql
-- stores: any member can read; only owner can update
alter table stores enable row level security;

create policy "members can view their store"
  on stores for select
  using (get_my_role(id) is not null);

create policy "owner can update store"
  on stores for update
  using (get_my_role(id) = 'owner');

-- products: members can read; manager+ can insert/update/delete
alter table products enable row level security;

create policy "members can view products"
  on products for select
  using (get_my_role(store_id) is not null);

create policy "manager+ can manage products"
  on products for all
  using (get_my_role(store_id) in ('owner', 'manager'));

-- orders: any member can insert; manager+ can update (void)
alter table orders enable row level security;

create policy "cashier+ can create orders"
  on orders for insert
  with check (get_my_role(store_id) in ('owner', 'manager', 'cashier'));

create policy "manager+ can void orders"
  on orders for update
  using (get_my_role(store_id) in ('owner', 'manager'));

-- bnpl_accounts: manager+ can manage; cashiers read-only
alter table bnpl_accounts enable row level security;

create policy "members can view bnpl accounts"
  on bnpl_accounts for select
  using (get_my_role(store_id) is not null);

create policy "manager+ can manage bnpl accounts"
  on bnpl_accounts for all
  using (get_my_role(store_id) in ('owner', 'manager'));

-- qr_channels: all members can read (needed at checkout); owner+ can manage
alter table qr_channels enable row level security;

create policy "members can view qr channels"
  on qr_channels for select
  using (get_my_role(store_id) is not null);

create policy "owner can manage qr channels"
  on qr_channels for all
  using (get_my_role(store_id) = 'owner');
```

> **Note for AI coding assistants:** Every new table must have RLS enabled and a minimum read policy scoped to `store_id`.

---

## 7. Authentication & Multi-Tenancy

### Auth flow

1. User signs up with email/password via Supabase Auth.
2. A `profiles` row is auto-created via a Postgres trigger on `auth.users`.
3. On first login with no stores, the user is prompted to create a store (becomes owner).
4. If a user arrives via an invite link (`/invite?token=...`), the token is validated, the invite is marked accepted, and a `store_members` row is created.

### Invite flow

```
Owner sends invite → insert into invites (email, role, token, expires_at)
→ Email sent with link: /invite?token=<uuid>
→ User clicks link → validate token (not expired, status=pending)
→ User signs up or logs in
→ insert into store_members (store_id, user_id, role)
→ update invites set status='accepted'
```

### Middleware (Next.js)

`middleware.ts` refreshes the Supabase session on every request and redirects unauthenticated users away from `(store)` routes.

### Store context

A React context (`StoreContext`) is provided at the `(store)/layout.tsx` level, making the current `store_id` and user's role available throughout the app without prop drilling.

```ts
// lib/store-context.tsx (simplified)
interface StoreContext {
  storeId: string;
  role: MemberRole;
  store: Store;
}
```

---

## 8. Role-Based Access Control

### Roles

| Role      | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `owner`   | Full access. The person who created the store. Cannot be removed.       |
| `manager` | Operational access. Can manage inventory, BNPL, and void orders.        |
| `cashier` | POS access only. Can ring up sales and optionally record BNPL payments. |
| `viewer`  | Read-only. Can view reports and orders but cannot make changes.         |

### Permission matrix

| Action                      | Owner | Manager | Cashier | Viewer |
| --------------------------- | :---: | :-----: | :-----: | :----: |
| Manage store settings       |   ✓   |    —    |    —    |   —    |
| Manage QR transfer channels |   ✓   |    —    |    —    |   —    |
| Invite / remove members     |   ✓   |    ±    |    —    |   —    |
| Change member roles         |   ✓   |    —    |    —    |   —    |
| Use POS terminal            |   ✓   |    ✓    |    ✓    |   —    |
| Apply order-level discounts |   ✓   |    ✓    |    ±    |   —    |
| Void / refund orders        |   ✓   |    ✓    |    —    |   —    |
| Add / edit products         |   ✓   |    ✓    |    —    |   —    |
| Delete products             |   ✓   |    ±    |    —    |   —    |
| Adjust stock                |   ✓   |    ✓    |    —    |   —    |
| Create BNPL accounts        |   ✓   |    ✓    |    —    |   —    |
| Record BNPL payments        |   ✓   |    ✓    |    ±    |   —    |
| Freeze / close BNPL account |   ✓   |    ✓    |    —    |   —    |
| View sales reports          |   ✓   |    ✓    |    —    |   ✓    |
| View BNPL receivables       |   ✓   |    ✓    |    —    |   ✓    |

`±` = configurable per store by owner (stored as a settings flag on the `stores` table, e.g. `cashier_can_discount`, `cashier_can_bnpl_payment`).

### Client-side permission utility

```ts
// lib/utils/permissions.ts
export function can(role: MemberRole, action: Action): boolean {
  const rules: Record<Action, MemberRole[]> = {
    void_order: ["owner", "manager"],
    manage_inventory: ["owner", "manager"],
    manage_bnpl: ["owner", "manager"],
    use_pos: ["owner", "manager", "cashier"],
    view_reports: ["owner", "manager", "viewer"],
  };
  return rules[action]?.includes(role) ?? false;
}
```

> **Note:** Client-side permission checks are for UX only (hiding buttons). Always enforce permissions in Supabase RLS policies and server-side checks.

---

## 9. POS Terminal

The POS terminal is a full-screen Client Component (`/pos/page.tsx`). It must feel instant — no full-page reloads during a transaction.

### Component tree

```
POSPage (Client Component)
├── ProductSearch / BarcodeInput
├── ProductGrid
│   └── ProductCard (click to add to cart)
├── CartPanel
│   ├── CartItem (qty controls, remove, item discount)
│   ├── OrderSummary (subtotal, discount, tax, total)
│   └── PaymentButton → opens PaymentModal
└── PaymentModal
    ├── CashPayment (tender input + change display)
    ├── QrTransferPayment (channel selector → QrPaymentScreen)
    │   └── QrPaymentScreen (fullscreen: QR image + amount overlay + confirm button)
    ├── CardPayment (reference number field)
    ├── BnplPayment (account selector)
    └── ConfirmButton → submits order
        → ReceiptModal
```

### Cart state (Zustand)

```ts
// lib/store/cart.ts
interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  orderDiscount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setOrderDiscount: (amount: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: (taxRate: number) => number;
}
```

### Order submission flow

1. User confirms payment in `PaymentModal`.
2. Client calls a Next.js Server Action `createOrder(cartItems, paymentDetails)`.
3. Server action runs a Supabase transaction:
   - Insert into `orders`
   - Insert all `order_items`
   - Decrement `products.stock_qty` for each item (check stock first)
   - If payment method is `bnpl`, increment `bnpl_accounts.balance_due`
   - If BNPL and installment schedule exists, insert into `bnpl_installments`
4. Return the created order to the client.
5. Cart is cleared, `ReceiptModal` opens.

### Stock decrement (Postgres function)

```sql
create or replace function process_order_stock(p_order_id uuid)
returns void as $$
declare
  item record;
begin
  for item in
    select product_id, quantity from order_items where order_id = p_order_id
  loop
    update products
    set stock_qty = stock_qty - item.quantity,
        updated_at = now()
    where id = item.product_id;

    if not found then
      raise exception 'Product % not found', item.product_id;
    end if;
  end loop;
end;
$$ language plpgsql;
```

---

## 10. Inventory Management

### Product form fields

| Field        | Type    | Required | Notes                        |
| ------------ | ------- | :------: | ---------------------------- |
| name         | text    |    ✓     |                              |
| sku          | text    |    —     | Auto-generate if blank       |
| barcode      | text    |    —     | EAN-13 / Code128             |
| category_id  | uuid    |    —     | FK to categories             |
| price        | numeric |    ✓     | Selling price                |
| cost_price   | numeric |    —     | For margin calculation       |
| stock_qty    | integer |    ✓     | Current stock                |
| low_stock_at | integer |    ✓     | Alert threshold, default 5   |
| unit         | text    |    ✓     | e.g. "pc", "kg", "box"       |
| image        | file    |    —     | Uploaded to Supabase Storage |

### Stock adjustment reasons

`purchase` · `return` · `damage` · `loss` · `correction` · `initial`

Every adjustment is written to `stock_adjustments` before updating `products.stock_qty`. This preserves a full audit trail.

---

## 11. BNPL System

This is a primary unique feature of CHO-HUAI POS. It models the informal credit arrangements common in small Thai shops and markets in a structured, trackable way.

### Data flow

```
bnpl_accounts (credit account per customer)
    └── bnpl_installments (repayment schedule)
            └── bnpl_payments (actual payments received)
```

### Creating a BNPL purchase

1. At POS checkout, cashier selects payment method = `bnpl`.
2. Cashier selects or creates a customer and links to their `bnpl_account`.
3. App validates: `account.balance_due + order.total <= account.credit_limit`.
4. Order is created with `payment_method = 'bnpl'` and `bnpl_account_id` set.
5. `bnpl_accounts.balance_due` is incremented by `order.total`.
6. Optionally, manager creates installment rows for the repayment schedule.

### Recording a payment

1. Navigate to BNPL account detail page.
2. Select the installment to pay against (or pay the full balance).
3. Enter amount paid, payment method, and optional notes.
4. Server action inserts into `bnpl_payments`.
5. Supabase trigger updates `bnpl_installments.status` and decrements `bnpl_accounts.balance_due`.

### Balance update trigger

```sql
create or replace function update_bnpl_balance_on_payment()
returns trigger as $$
begin
  -- Decrement balance_due on the account
  update bnpl_accounts
  set balance_due = balance_due - NEW.amount_paid,
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
$$ language plpgsql;

create trigger bnpl_payment_inserted
  after insert on bnpl_payments
  for each row execute function update_bnpl_balance_on_payment();
```

### Business rules

- **Credit limit enforcement:** Blocked at both client and server level. The server action checks `balance_due + order_total <= credit_limit` before committing.
- **Account freeze:** Owner/manager can set `status = 'frozen'`, blocking future BNPL purchases. Existing installments are still visible and payable.
- **Account settled:** When `balance_due = 0` and all installments are paid, status can be set to `settled`.
- **Overdue detection:** Derived on the frontend — `const isOverdue = (i) => i.status === 'pending' && new Date(i.due_date) < new Date()`. No stored status, no scheduler.

### BNPL account status transitions

```
active → frozen   (manager freezes account)
active → settled  (balance cleared)
frozen → active   (manager unfreezes)
any    → closed   (owner explicitly closes)
```

---

## 12. QR Transfer Payment

### Design philosophy

This feature is intentionally zero-integration. The store owner uploads a static QR code image (screenshot from their banking app, PromptPay QR, bank app QR screenshot, etc.) and the POS takes care of displaying it with the correct amount at checkout. No API keys, no webhooks, no transaction fees — just an image and a number.

### Setup flow (owner, in Settings → QR Channels)

1. Owner navigates to **Settings → QR Transfer Channels**.
2. Taps **Add channel** → enters a label (e.g. "PromptPay") and uploads the QR image.
3. The image is uploaded to Supabase Storage bucket `qr-codes` under the path `{store_id}/{uuid}.{ext}`.
4. A `qr_channels` row is created with the public image URL.
5. Owner can reorder channels (drag), enable/disable them, or delete them.
6. Multiple channels are supported (e.g. PromptPay + TrueMoney + KBank all active at once).

### Checkout flow (cashier, in POS)

1. Cashier taps **QR Transfer** in the payment method selector.
2. If more than one QR channel is enabled, a channel picker is shown (e.g. "PromptPay · TrueMoney · KBank"). Cashier selects the one the customer wants to use.
3. The `QrPaymentScreen` component mounts in fullscreen / modal-overlay mode showing:
   - The QR code image, sized to fill the available width (max ~400px) for easy phone scanning.
   - The **exact amount to pay** displayed in large type directly below the QR, formatted using the store's currency settings (e.g. "฿ 245" for THB with 0 decimals).
   - The channel label ("Pay via PromptPay") and store name as context.
   - An optional instruction line: _"Show your payment confirmation to the cashier."_
4. Customer scans with their phone and completes payment in their app.
5. Customer shows the cashier their payment confirmation screen.
6. Cashier optionally enters the **reference number** from the confirmation (for reconciliation).
7. Cashier taps **Confirm payment received** → order is recorded with `payment_method = 'qr_transfer'` and the selected `qr_channel_id`.

### `QrPaymentScreen` component

```tsx
// components/pos/QrPaymentScreen.tsx
interface QrPaymentScreenProps {
  channel: QrChannel; // { label, image_url }
  amount: number; // exact order total (raw number, unformatted)
  store: Pick<
    Store,
    "currency_symbol" | "currency_decimals" | "symbol_position"
  >;
  onConfirm: (referenceNumber?: string) => void;
  onCancel: () => void;
}

// Rendering notes:
// - Amount display: use formatCurrency(amount, store) — never hardcode the symbol or decimal places
// - image: next/image with unoptimized={true} (it's a user upload, not a known domain)
// - amount: rendered at ~48px font weight 600
// - reference number: optional <input> below the QR, not required to confirm
// - "Confirm payment received" button is the primary CTA, full width, bottom of screen
// - "Cancel" link sits above or beside the confirm button
// - On mobile: the component should be fullscreen (fixed inset-0) so the QR is as large as possible
```

### Orders schema impact

The `orders` table stores `payment_method = 'qr_transfer'`. Add a nullable column to capture which channel was used and the reference number:

```sql
alter table orders
  add column qr_channel_id  uuid references qr_channels(id) on delete set null,
  add column qr_reference   text;    -- optional reference number entered by cashier
```

### Supabase Storage setup

```sql
-- In Supabase dashboard or via migration:
-- Bucket: qr-codes, public: true
-- Policy: authenticated users can upload to their own store's path

insert into storage.buckets (id, name, public)
values ('qr-codes', 'qr-codes', true);

create policy "owner can upload qr codes"
  on storage.objects for insert
  with check (
    bucket_id = 'qr-codes'
    and auth.uid() is not null
  );

create policy "anyone can read qr codes"
  on storage.objects for select
  using (bucket_id = 'qr-codes');
```

### Server Action

```ts
// app/actions/settings.ts
export async function saveQrChannel(data: {
  label: string;
  imageFile: File;
  storeId: string;
}): Promise<QrChannel>;

export async function updateQrChannel(
  id: string,
  data: Partial<{
    label: string;
    is_enabled: boolean;
    sort_order: number;
  }>,
): Promise<QrChannel>;

export async function deleteQrChannel(id: string): Promise<void>;
// Note: also delete the image from Supabase Storage on delete
```

### UX considerations

- **Image quality warning:** If the uploaded image is smaller than 300×300 px, show a warning: _"This image may be hard to scan. Consider uploading a higher-resolution version."_
- **No amount encoding in QR:** The amount is displayed as a text overlay only — it is not encoded into the QR itself, since static QR codes for most Thai e-wallets and PromptPay do not support dynamic amounts. The customer manually enters the amount in their app after scanning.
- **Currency-aware display:** The amount overlay must use the store's `currency_symbol`, `currency_decimals`, and `symbol_position` — e.g. Thai stores show `฿ 245` (0 decimals, prefix), while a USD store would show `$ 12.50` (2 decimals, prefix).
- **Instruction clarity:** The screen should make clear to the customer exactly how much to type in their app. Large, unambiguous amount display is the primary UX goal.
- **Receipt:** When `payment_method = 'qr_transfer'`, the receipt shows the channel label and reference number (if entered) in the payment details section.

---

## 13. Team Management

### Invite flow (detailed)

```ts
// Server action: sendInvite(email, role, storeId)
// 1. Check caller has owner or manager role
// 2. Check email not already a member of the store
// 3. Generate a UUID token; set expires_at = now() + 7 days
// 4. Insert into invites table
// 5. Send email via Supabase Auth or a transactional email service
//    Email contains: /invite?token=<uuid>

// Page: /invite?token=...
// 1. Validate token (not expired, status=pending)
// 2. If user not logged in → redirect to /signup?invite=<token>
// 3. On sign up / login completion, consume token:
//    - insert into store_members (store_id, user_id, role)
//    - update invites set status='accepted'
//    - redirect to /(store)/dashboard
```

### Activity log (optional enhancement)

Store a lightweight log of significant member actions for the owner to review:

```sql
create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  user_id     uuid references auth.users(id),
  action      text not null,   -- e.g. 'order.created', 'stock.adjusted', 'bnpl.payment'
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz default now()
);
```

---

## 14. Reports

### Available reports

| Report                     | Data source                                                                          | Notes                                                         |
| -------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Daily sales summary        | `orders` grouped by date                                                             | Subtotal, discounts, tax, total                               |
| Sales by payment method    | `orders.payment_method`                                                              | Bar chart breakdown; QR Transfer broken down by channel label |
| Best-selling products      | `order_items` grouped by product                                                     | Top 10 by quantity or revenue                                 |
| BNPL receivables           | `bnpl_accounts` where balance_due > 0                                                | Sortable by amount or overdue                                 |
| Overdue installments       | `bnpl_installments` where status = `pending` — filtered client-side by `isOverdue()` | List with customer contact                                    |
| Staff performance          | `orders` grouped by cashier_id                                                       | Orders count, total sales, voids                              |
| QR Transfer reconciliation | `orders` where payment_method = 'qr_transfer'                                        | Channel, amount, reference number per transaction             |

### Report queries use Supabase Server Components to avoid exposing raw data to the client. All queries include `store_id` filtering enforced by RLS.

---

## 15. App Router — Pages & Routes

| Route                   | Auth | Min Role       | Component type             |
| ----------------------- | :--: | -------------- | -------------------------- |
| `/`                     |  No  | —              | Server (marketing/landing) |
| `/login`                |  No  | —              | Client                     |
| `/signup`               |  No  | —              | Client                     |
| `/invite`               |  No  | —              | Server + Client            |
| `/dashboard`            | Yes  | viewer         | Server                     |
| `/pos`                  | Yes  | cashier        | Client (full interactive)  |
| `/inventory`            | Yes  | cashier (read) | Server                     |
| `/inventory/new`        | Yes  | manager        | Client                     |
| `/inventory/[id]`       | Yes  | cashier (read) | Server                     |
| `/inventory/[id]/edit`  | Yes  | manager        | Client                     |
| `/orders`               | Yes  | manager        | Server                     |
| `/orders/[id]`          | Yes  | cashier        | Server                     |
| `/bnpl`                 | Yes  | manager        | Server                     |
| `/bnpl/new`             | Yes  | manager        | Client                     |
| `/bnpl/[id]`            | Yes  | manager        | Server                     |
| `/bnpl/[id]/payment`    | Yes  | cashier ±      | Client                     |
| `/team`                 | Yes  | owner          | Server + Client            |
| `/reports`              | Yes  | viewer         | Server                     |
| `/settings`             | Yes  | owner          | Client                     |
| `/settings/qr-channels` | Yes  | owner          | Client                     |

---

## 16. API Routes (Server Actions / Route Handlers)

Prefer **Server Actions** for form mutations. Use **Route Handlers** for webhook endpoints or external integrations.

### Server Actions

```ts
// app/actions/orders.ts
export async function createOrder(data: CreateOrderInput): Promise<Order>;
// CreateOrderInput includes: cartItems, paymentMethod, qrChannelId?, qrReference?, bnplAccountId?
export async function voidOrder(orderId: string, reason: string): Promise<void>;

// app/actions/inventory.ts
export async function createProduct(data: ProductInput): Promise<Product>;
export async function updateProduct(
  id: string,
  data: Partial<ProductInput>,
): Promise<Product>;
export async function adjustStock(
  productId: string,
  qty: number,
  reason: AdjustmentReason,
): Promise<void>;

// app/actions/bnpl.ts
export async function createBnplAccount(
  data: BnplAccountInput,
): Promise<BnplAccount>;
export async function recordPayment(
  data: BnplPaymentInput,
): Promise<BnplPayment>;
export async function updateAccountStatus(
  accountId: string,
  status: BnplAccountStatus,
): Promise<void>;

// app/actions/team.ts
export async function sendInvite(
  email: string,
  role: MemberRole,
): Promise<void>;
export async function removeMember(memberId: string): Promise<void>;
export async function updateMemberRole(
  memberId: string,
  role: MemberRole,
): Promise<void>;

// app/actions/settings.ts
export async function saveQrChannel(data: {
  label: string;
  imageFile: File;
  storeId: string;
}): Promise<QrChannel>;
export async function updateQrChannel(
  id: string,
  data: Partial<{ label: string; is_enabled: boolean; sort_order: number }>,
): Promise<QrChannel>;
export async function deleteQrChannel(id: string): Promise<void>;
// deleteQrChannel also removes the image file from Supabase Storage

export async function updateStoreCurrency(
  storeId: string,
  data: {
    currency_code: string; // ISO 4217, e.g. 'THB', 'USD', 'SGD'
    currency_symbol: string; // display symbol, e.g. '฿', '$', 'S$'
    currency_decimals: number; // 0 for THB, 2 for USD/SGD
    symbol_position: "prefix" | "suffix";
  },
): Promise<Store>;
// Only callable by owner. Validates currency_decimals is 0–4.
// After update, revalidatePath('/settings') and revalidatePath('/pos').
```

---

## 17. State Management

### POS cart (Zustand)

The cart is the only significant global client state. All other state is server-fetched via Server Components or React Query (if needed for polling).

```ts
// lib/store/cart.ts
import { create } from "zustand";

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  orderDiscount: 0,

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
            discount: 0,
          },
        ],
      };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  clearCart: () => set({ items: [], orderDiscount: 0 }),

  subtotal: () =>
    get().items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity - i.discount,
      0,
    ),

  total: (taxRate) => {
    const sub = get().subtotal() - get().orderDiscount;
    return sub + (sub * taxRate) / 100;
  },
}));
```

---

## 18. Key UI Components

### Tailwind CSS v4 theme tokens (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-brand: #16a34a; /* green-600 */
  --color-brand-light: #dcfce7;
  --color-danger: #dc2626;
  --color-warning: #d97706;
  --font-sans: "Geist", sans-serif;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

### `formatCurrency` utility

All price and amount rendering throughout the app (POS terminal, receipts, BNPL screens, QR overlay, reports) must use this shared utility. Never hardcode `฿` or `THB` in components.

```ts
// lib/utils/currency.ts
interface CurrencyStore {
  currency_symbol: string; // e.g. "฿", "$", "€"
  currency_decimals: number; // e.g. 0 for THB, 2 for USD
  symbol_position: "prefix" | "suffix";
}

export function formatCurrency(amount: number, store: CurrencyStore): string {
  const fixed = amount.toFixed(store.currency_decimals);
  const formatted = Number(fixed).toLocaleString(undefined, {
    minimumFractionDigits: store.currency_decimals,
    maximumFractionDigits: store.currency_decimals,
  });
  return store.symbol_position === "prefix"
    ? `${store.currency_symbol}${formatted}`
    : `${formatted} ${store.currency_symbol}`;
}

// Default store currency values (used during onboarding and as fallback)
export const DEFAULT_CURRENCY: CurrencyStore = {
  currency_symbol: "฿",
  currency_decimals: 0,
  symbol_position: "prefix",
};
```

### POS ProductCard

```tsx
// Quick-add product tile used in ProductGrid
interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}
// Shows: image/icon, name, price, stock badge (low stock warning)
// Disabled state when stock_qty === 0
```

### PaymentModal

A multi-step modal:

1. **Select method** — Cash / QR Transfer / Card / BNPL
2. **Payment details** — cash: tender input + change display; QR Transfer: channel picker → transitions to QrPaymentScreen; BNPL: account selector + credit available
3. **Confirm** — summary of total, method, then submit

### QrPaymentScreen

```tsx
// components/pos/QrPaymentScreen.tsx
// Fullscreen overlay shown after cashier selects QR Transfer channel.
// Props: channel (label + image_url), amount (number), store (currency settings),
//        onConfirm(referenceNumber?: string), onCancel()
// Layout (top → bottom):
//   - Channel label ("Pay via PromptPay")
//   - QR code image — next/image unoptimized, max-width ~400px, centered
//   - Amount via formatCurrency(amount, store) in large type — 48px, weight 600
//   - Instruction: "Enter this amount in your app, then scan"
//   - Optional reference number input (label: "Reference no. (optional)")
//   - Primary CTA: "Confirm payment received" (full width)
//   - Secondary: "Cancel" text link
// Mobile: renders fixed inset-0 so QR fills the screen for easy scanning
```

### QrChannelCard

```tsx
// components/settings/QrChannelCard.tsx
// Displays a single QR channel in the Settings → QR Channels list.
// Shows: QR image thumbnail, label, enabled/disabled toggle, edit and delete actions.
// Draggable for reordering (sort_order); uses @dnd-kit/sortable or similar.
```

### AccountStatusBadge

```tsx
// Renders a colored pill for bnpl_account_status
// active → green, frozen → amber, settled → blue, closed → gray
// Overdue is not a stored status — derive it with isOverdue(installment) and apply red styling at the installment row level, not the account level
```

---

## 19. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>      # Server only, never expose to client

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default store currency (applied to new stores at creation time; overridable per store in Settings)
NEXT_PUBLIC_DEFAULT_CURRENCY_CODE=THB
NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL=฿
NEXT_PUBLIC_DEFAULT_CURRENCY_DECIMALS=0
NEXT_PUBLIC_DEFAULT_SYMBOL_POSITION=prefix

# Optional: SMS notifications for BNPL reminders (e.g. Thaibulk SMS or similar Thai provider)
THAIBULKSMS_API_KEY=<key>
THAIBULKSMS_SENDER_NAME=CHOHUAIPOS
```

---

## 20. Development Conventions

> These are **firm project decisions**, not suggestions. All contributors and AI coding assistants must follow them consistently throughout the codebase.

---

### Naming

- Database: `snake_case` for all table and column names
- TypeScript: `PascalCase` for types/interfaces, `camelCase` for variables and functions
- Files: `PascalCase` for components, `camelCase` for utilities and hooks
- Zustand stores: `use<n>Store` (e.g. `useCartStore`)
- Custom hooks: `use<n>` prefix, colocated in the feature folder they belong to

---

### File & folder structure — feature folders

Each feature owns its own slice of the codebase. Do **not** place components, hooks, or actions in global folders unless they are genuinely shared across more than one feature.

```
features/
  pos/
    components/       # ProductGrid, CartPanel, PaymentModal, QrPaymentScreen…
    hooks/            # useCartTotals, useProductSearch…
    actions.ts        # createOrder, voidOrder
  bnpl/
    components/       # AccountCard, InstallmentRow, PaymentForm…
    hooks/            # useBnplAccount, useIsOverdue…
    actions.ts        # createBnplAccount, recordPayment, updateAccountStatus
  inventory/
    components/       # ProductForm, StockAdjustModal…
    hooks/            # useStockLevel…
    actions.ts        # createProduct, updateProduct, adjustStock
  team/
    components/       # MemberRow, InviteForm…
    actions.ts        # sendInvite, removeMember, updateMemberRole
  settings/
    components/       # QrChannelCard, QrChannelForm, CurrencyForm…
    actions.ts        # saveQrChannel, updateQrChannel, deleteQrChannel, updateStoreCurrency
components/
  ui/                 # Only truly shared primitives: Button, Input, Modal, Badge, Table, Avatar
lib/
  supabase/           # client.ts, server.ts, middleware.ts
  utils/              # currency.ts, receipt.ts, permissions.ts, cn.ts
  store/              # cart.ts (Zustand)
```

**Rule:** if a component, hook, or action is used by exactly one feature, it lives inside that feature's folder. It only moves to `components/ui/` or `lib/` when a second feature needs it.

---

### Data fetching — Server Components for reads, Server Actions for mutations

- **Reads → Server Components.** Fetch data directly with the Supabase server client inside `page.tsx` or layout Server Components. Pass data down as props to child components.
- **Mutations → Server Actions.** All creates, updates, deletes, and side-effectful operations go through Server Actions in the feature's `actions.ts`. Call `revalidatePath()` at the end of each action so the page re-fetches fresh data.
- **Never use** `useEffect` + `fetch` for data loading. Never create Route Handlers (`/api/...`) just to proxy Supabase calls — Server Actions replace that pattern entirely.
- **Client Components** receive their initial data as props from a Server Component parent. They may call Server Actions for mutations but do not fetch data independently.

```ts
// ✅ Correct — Server Component reads, Server Action mutates
// app/(store)/bnpl/page.tsx (Server Component)
const accounts = await supabase.from('bnpl_accounts').select('*').eq('store_id', storeId)
return <BnplList accounts={accounts.data} />

// features/bnpl/actions.ts (Server Action)
'use server'
export async function recordPayment(data: BnplPaymentInput) {
  await supabase.from('bnpl_payments').insert(data)
  revalidatePath('/bnpl')
}

// ❌ Wrong — Client Component fetching its own data
useEffect(() => { fetch('/api/bnpl/accounts').then(...) }, [])
```

---

### Styling — Tailwind + cva for component variants

Use Tailwind utility classes for all styling. For any component that has more than one visual variant (size, intent, state), use `cva` (class-variance-authority) to define them explicitly rather than inline ternaries.

```ts
// ✅ Correct — cva for a Button with variant + size
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary:   'bg-brand text-white hover:bg-brand/90',
        secondary: 'bg-transparent border border-input hover:bg-accent',
        danger:    'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />
}

// ❌ Wrong — inline ternaries for variants
className={`px-4 py-2 ${isDelete ? 'bg-red-600' : 'bg-brand'} ${large ? 'text-lg' : 'text-sm'}`}
```

Add `class-variance-authority` and `tailwind-merge` to dependencies. Use `cn()` for conditional class merging:

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### TypeScript — strict, no `any`, no non-null assertions

`tsconfig.json` must have `"strict": true`. Two additional rules beyond that:

- **No `any`** — if the type is genuinely unknown, use `unknown` and narrow it. If a library type is missing, write a local declaration file rather than casting to `any`.
- **No non-null assertions (`!`)** — use optional chaining (`?.`), nullish coalescing (`??`), or explicit early returns instead.

```ts
// ✅ Correct
const name = store?.name ?? "Unnamed store";
if (!user) return null;

// ❌ Wrong
const name = store!.name;
const user = getUser() as User;
```

Generate and commit Supabase types after every migration:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

Use Zod schemas for all form inputs and Server Action payloads. The inferred Zod type is the single source of truth — do not duplicate type definitions manually.

```ts
// features/bnpl/schemas.ts
export const BnplPaymentSchema = z.object({
  installment_id: z.string().uuid(),
  amount_paid: z.number().positive(),
  payment_method: z.enum(["cash", "qr_transfer", "card"]),
  notes: z.string().optional(),
});
export type BnplPaymentInput = z.infer<typeof BnplPaymentSchema>;
```

---

### State management — React Context for simple, Zustand for complex

- **React Context** — for read-mostly shared state that doesn't change frequently. Primary use: `StoreContext` (current store record + user role) provided at `(store)/layout.tsx`.
- **Zustand** — for client state that changes frequently or is mutated from multiple places. Currently only the POS cart (`useCartStore`). Before adding a new Zustand store, confirm the state can't live in URL params or React Context.
- **URL state (`searchParams`)** — preferred for filters, pagination, and tab state. Keeps the UI shareable and bookmarkable.
- Avoid deeply nested prop drilling — if a value crosses more than two component levels, reach for Context or URL state before adding a new Zustand store.

---

### Error handling — return `{ data, error }` for validation, throw for fatal errors

Two distinct patterns depending on the nature of the failure:

- **Validation & business logic failures** (bad input, credit limit exceeded, duplicate SKU) → return `{ data: null, error: string }`. These are expected, recoverable, and should surface as toast messages — not crash the page.
- **Fatal / unexpected failures** (database unreachable, auth session missing, unrecoverable server state) → `throw new Error(...)`. These propagate to the nearest `error.tsx` boundary, which shows a generic error page.

```ts
// Shared result type for recoverable actions
type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function recordPayment(
  input: BnplPaymentInput,
): Promise<ActionResult<BnplPayment>> {
  // Validation failure → return error (recoverable, show to user)
  const parsed = BnplPaymentSchema.safeParse(input);
  if (!parsed.success)
    return { data: null, error: parsed.error.issues[0].message };

  // Business logic failure → return error (recoverable, show to user)
  const account = await getAccount(parsed.data.installment_id);
  if (!account) return { data: null, error: "Account not found." };

  const { data, error } = await supabase
    .from("bnpl_payments")
    .insert(parsed.data)
    .select()
    .single();

  // Fatal DB failure → throw (unexpected, crash to error.tsx)
  if (error) throw new Error(`DB insert failed: ${error.message}`);

  revalidatePath("/bnpl");
  return { data, error: null };
}

// Surface recoverable errors in the Client Component via react-hot-toast
const result = await recordPayment(formData);
if (result.error) toast.error(result.error);
else toast.success("Payment recorded");
```

**Decision rule for which to use:**

| Scenario                                           | Pattern                        |
| -------------------------------------------------- | ------------------------------ |
| Zod validation failed                              | `return { data: null, error }` |
| Business rule violated (credit limit, stock empty) | `return { data: null, error }` |
| Record not found (expected possibility)            | `return { data: null, error }` |
| Supabase insert/update returned an error           | `throw new Error(...)`         |
| Auth session missing mid-action                    | `throw new Error(...)`         |
| Completely unexpected state                        | `throw new Error(...)`         |

---

### Currency rendering

- **Never hardcode** `฿`, `THB`, or any currency symbol/code anywhere in components or templates.
- Always call `formatCurrency(amount, store)` from `lib/utils/currency.ts` for every displayed price — POS cart totals, receipts, BNPL balances, QR amount overlay, and report figures.
- The `store` object is available via `StoreContext`. Pass it as a prop to child components that render prices rather than re-reading context deep in the tree.
- `DEFAULT_CURRENCY` (`THB` / `฿` / `0` decimals / `prefix`) is used only during onboarding, before a `stores` row exists.

---

### Migrations

- One migration file per logical change — never bundle unrelated schema changes.
- Never edit a migration that has already been applied to production; write a new one instead.
- Run locally with `supabase db reset` during development.
- Re-generate types after every migration: `supabase gen types typescript --local > lib/supabase/types.ts`.

## 21. Milestones & Build Order

### Phase 1 — Foundation (Week 1–2)

- [ ] Supabase project setup, initial schema migration, RLS policies
- [ ] Next.js project init with Tailwind v4 and Supabase SSR
- [ ] Auth: sign up, login, session middleware
- [ ] Store creation flow (owner onboarding) — includes currency settings step (default THB / ฿ / 0 dp)
- [ ] `formatCurrency` utility and `StoreContext` wired up
- [ ] Basic layout shell with navigation

### Phase 2 — Core POS (Week 3–4)

- [ ] Product management (CRUD + image upload)
- [ ] Categories
- [ ] POS terminal: product grid, cart, cash payment
- [ ] Order creation Server Action with stock decrement
- [ ] QR Transfer: `qr_channels` table, Settings UI, `QrPaymentScreen` component
- [ ] Receipt display (print-ready) — includes QR channel label + reference number

### Phase 3 — Team & Roles (Week 5)

- [ ] Invite system (token generation, email, redemption)
- [ ] Role-based UI guards
- [ ] Member management page

### Phase 4 — BNPL (Week 6–7)

- [ ] BNPL account CRUD
- [ ] BNPL payment method in POS
- [ ] Installment schedule management
- [ ] Payment recording + balance trigger
- [ ] Overdue display logic (frontend `isOverdue` helper + red badge on InstallmentRow)

### Phase 5 — Reports & Polish (Week 8)

- [ ] Sales reports with Recharts (including QR Transfer per-channel breakdown)
- [ ] BNPL receivables report
- [ ] QR Transfer reconciliation report (reference numbers + amounts)
- [ ] Low-stock dashboard alerts
- [ ] Settings page — store config, receipt customization, QR channel management, currency settings
- [ ] Mobile responsiveness pass

### Phase 6 — Launch Prep

- [ ] End-to-end testing (critical paths: checkout cash, checkout QR transfer, BNPL purchase, payment recording)
- [ ] Supabase production project setup
- [ ] Deploy to Vercel
- [ ] Seed demo data script

---

_End of document. Generated as a planning reference for the CHO-HUAI POS project._
