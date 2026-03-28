# Queries vs Actions: When to Use Each

## Quick Reference

| **Queries** | **Actions** |
|-----------|----------|
| **Purpose** | Read data only | Modify/Write data |
| **Directive** | None needed | `"use server"` required |
| **Called from** | Server Components, layouts | Form submissions, events, API routes |
| **Cache invalidation** | No | Yes (must call `revalidatePath()`) |
| **Error handling** | Simple (throw) | Form validation + error recovery |
| **When to use** | Fetching data to display | Mutations, state changes |

## Queries: Reading Data

**Location:** `src/lib/queries/`

Queries are pure read operations. They fetch data and return it without modifying the database.

### Characteristics

- ✅ No `"use server"` directive needed
- ✅ Called directly from Server Components
- ✅ Simple error handling (throw errors)
- ✅ Returns data in a clean, typed format
- ✅ Can be reused across multiple pages/components

### Example: Admin Dashboard Query

```typescript
// src/lib/queries/admin.ts
import { createTypedServerClient } from "@/lib/supabase/typed-client";

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createTypedServerClient();

  const [
    { count: storeCount },
    { count: userCount },
    { data: recentStores },
    // ... more queries
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    storeCount,
    userCount,
    recentStores,
  };
}
```

### Usage in Server Component

```tsx
// src/app/(admin)/admin/page.tsx
import { getAdminDashboardStats } from "@/lib/queries/admin";

export default async function AdminDashboardPage() {
  const { storeCount, userCount, recentStores } = await getAdminDashboardStats();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Stores: {storeCount}</p>
      <p>Users: {userCount}</p>
    </div>
  );
}
```

### Common Query Patterns

**Authentication:**
```typescript
// src/lib/queries/auth.ts
export async function getCurrentUser() {
  const supabase = await createTypedServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

**Dashboard Data:**
```typescript
// src/lib/queries/dashboard.ts
export async function getUserDashboardData(userId: string) {
  const supabase = await createTypedServerClient();
  
  const [profile, stores] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("store_members").select("*").eq("user_id", userId),
  ]);
  
  return { profile, stores };
}
```

---

## Actions: Modifying Data

**Location:** `src/lib/actions/`

Actions are server functions that modify data. They handle validation, database mutations, and cache revalidation.

### Characteristics

- ✅ Must have `"use server"` directive
- ✅ Used for form submissions and mutations
- ✅ Include input validation with Zod
- ✅ Call `revalidatePath()` to refresh cached data
- ✅ Handle errors and return success/error results
- ✅ Can only be called from forms or other server functions

### Example: Admin Action

```typescript
// src/lib/actions/admin.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase/typed-client";

const SuspendUserSchema = z.object({
  userId: z.string().uuid(),
  suspend: z.boolean(),
});

export async function setUserSuspension(formData: FormData) {
  // 1. Validate input
  const parsed = SuspendUserSchema.safeParse({
    userId: formData.get("userId"),
    suspend: formData.get("suspend") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  // 2. Check authorization
  const supabase = await createTypedServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  // 3. Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return { ok: false, error: "Insufficient permissions" };
  }

  // 4. Modify database
  await supabase
    .from("profiles")
    .update({ is_suspended: parsed.data.suspend })
    .eq("id", parsed.data.userId);

  // 5. Revalidate cache so UI updates
  revalidatePath("/admin/users");

  return { ok: true };
}
```

### Usage in Form

```tsx
// Component with form
"use client";

import { setUserSuspension } from "@/lib/actions/admin";

export function UserRow({ user }) {
  return (
    <form action={setUserSuspension}>
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="suspend" value={String(!user.is_suspended)} />
      <button type="submit">
        {user.is_suspended ? "Unsuspend" : "Suspend"}
      </button>
    </form>
  );
}
```

---

## The Data Flow: Complete Example

### Scenario: Admin Users Page with Suspend Button

```
┌─────────────────────────────────────────────────────────────┐
│ Server Component: AdminUsersPage                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. QUERY: Fetch users for initial page load                │
│     const users = await getAdminUsers();                     │
│     ↓                                                         │
│     Returns: { id, name, is_suspended, ... }[]              │
│                                                               │
│  2. Render page with users                                   │
│     {users.map(user => (                                    │
│       <UserRow user={user} />                               │
│     ))}                                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
    User clicks "Suspend" button
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Action: setUserSuspension                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Validate form data                                       │
│  2. Check permissions                                        │
│  3. Modify database                                          │
│     await supabase.from("profiles").update(...)             │
│  4. Revalidate cache                                         │
│     revalidatePath("/admin/users")                           │
│  5. Return success/error                                     │
│     { ok: true }                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
    Cache revalidated
         ↓
    Page re-renders with fresh data
         ↓
    QUERY runs again: getAdminUsers()
         ↓
    Page shows updated user list
```

---

## Why You Need Both

### If You Only Had Queries

❌ **Problem:** You couldn't safely handle form submissions:

```tsx
// ❌ UNSAFE - No validation, no cache refresh, no permission checks
export default async function Page() {
  const handleSuspend = async (userId) => {
    await supabase.from("profiles").update({ is_suspended: true });
    // Cache never revalidated - stale data displayed!
  };
}
```

### If You Only Had Actions

❌ **Problem:** You couldn't fetch initial page data:

```tsx
// ❌ This won't work
export default async function Page() {
  const suspendUserAction = async (formData) => { /* ... */ };
  const users = await suspendUserAction(); // ERROR: wrong usage
}
```

---

## Best Practices

### Queries

✅ Keep them pure (no side effects)  
✅ Return typed data matching your component needs  
✅ Use `Promise.all()` for multiple independent queries  
✅ Batch related queries together  
✅ Reuse across pages and components  

### Actions

✅ Always validate input with Zod  
✅ Check authorization before modifying  
✅ Call `revalidatePath()` or `revalidateTag()` after mutations  
✅ Return clear success/error responses  
✅ Keep validation logic close to the action  
✅ Use descriptive names: `setUserSuspension`, `createStore`, etc.  

---

## File Organization

```
src/
  lib/
    queries/
      auth.ts          ← getCurrentUser(), requireCurrentUser()
      admin.ts         ← getAdminDashboardStats()
      dashboard.ts     ← getUserDashboardData()
      inventory.ts     ← getStoreInventory()
      ...
    actions/
      admin.ts         ← setUserSuspension(), setUserSuperAdmin()
      auth.ts          ← signUp(), signIn(), resetPassword()
      inventory.ts     ← addInventoryItem(), updateStock()
      ...
```

---

## Summary

- **Queries** = Read data, display to user
- **Actions** = Handle form submissions, modify data, refresh UI
- Use **queries** to fetch initial page data
- Use **actions** for user interactions (buttons, forms)
- Always revalidate cache after mutations
- Always validate input in actions
