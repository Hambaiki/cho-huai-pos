# Button Component Refactoring & Implementation Guide

## Overview

We've successfully implemented a standardized, reusable `Button` component using shadcn/ui patterns based on `class-variance-authority` (CVA). This replaces ad-hoc inline Tailwind button styles with a scalable, maintainable component system.

## What Changed

### Files Created

1. **[Button.tsx](./Button.tsx)** - Main Button component with CVA-based variants
2. **[Button.usage.md](./Button.usage.md)** - Comprehensive usage documentation
3. **[index.ts](./index.ts)** - Barrel export for easy imports

### Files Refactored (9 components)

1. ✅ **PaginationControls.tsx** - Previous/Next navigation buttons
2. ✅ **StoresHubClient.tsx** - "New Store" action buttons
3. ✅ **AccountSettingsClient.tsx** - Form submission buttons (4 buttons)
4. ✅ **SettingsClient.tsx** - Settings save button
5. ✅ **ProductGrid.tsx** - Filter & category tabs (5+ buttons)
6. ✅ **AdminUsersTable.tsx** - Admin action buttons & modals (6+ buttons)
7. ✅ **BnplAccountsPageClient.tsx** - BNPL account action buttons
8. ✅ **RecordPaymentForm.tsx** - Payment method & quick amount buttons
9. ✅ **RecordGeneralPaymentForm.tsx** - Payment method & quick amount buttons

**Total buttons refactored: 30+** ✓ Build verified and passing

---

## Button Component Features

### Variants (7 types)

```tsx
variant = "primary"; // Blue brand color (default)
variant = "secondary"; // Neutral gray background
variant = "outline"; // Border-only, white background
variant = "ghost"; // No background, underline on hover
variant = "destructive"; // Red for delete/remove actions
variant = "success"; // Green for positive confirmations
variant = "warning"; // Orange for cautions
```

### Sizes (7 options)

```tsx
size = "sm"; // height: 32px, text: xs
size = "md"; // height: 36px, text: sm (default)
size = "lg"; // height: 40px, text: base
size = "xl"; // height: 48px, text: base
size = "icon"; // 36x36px square
size = "icon-sm"; // 32x32px square
size = "icon-lg"; // 40x40px square
```

### Built-in Features

- ✅ Full keyboard navigation & accessibility
- ✅ Disabled state handling with reduced opacity
- ✅ Focus ring visibility for keyboard users
- ✅ Loading state with animated spinner icon
- ✅ Icon support (left/right positioning)
- ✅ Type-safe via TypeScript generics

---

## Quick Migration Examples

### Before (inline Tailwind)

```tsx
<button
  type="button"
  onClick={handleClick}
  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
>
  <Plus size={16} />
  New Item
</button>
```

### After (Button component)

```tsx
<Button icon={<Plus size={16} />} onClick={handleClick}>
  New Item
</Button>
```

**Benefits:**

- 80% less code
- Automatic hover/focus/disabled states
- Consistent across the app
- Easy variant changes

---

## Common Patterns

### Primary Action (Default)

```tsx
<Button onClick={handleSave}>Save</Button>
```

### Secondary/Alternative Action

```tsx
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>
```

### Destructive Action

```tsx
<Button
  variant="destructive"
  icon={<Trash2 size={16} />}
  onClick={handleDelete}
>
  Delete
</Button>
```

### Loading State

```tsx
<Button isLoading={isPending}>
  {isPending ? "Saving..." : "Save Changes"}
</Button>
```

### Icon-Only Button

```tsx
<Button size="icon" variant="ghost" icon={<Menu size={20} />} />
```

### Toggle/Filter Buttons

```tsx
<Button
  variant={isActive ? "active" : "outline"}
  onClick={() => setActive(!isActive)}
>
  {label}
</Button>
```

### In Modal Footer

```tsx
<ModalFooter>
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button onClick={handleConfirm}>Confirm</Button>
</ModalFooter>
```

---

## Importing

### Recommended: Use barrel export

```tsx
import { Button } from "@/components/ui";
```

### Direct import (also works)

```tsx
import { Button } from "@/components/ui/Button";
```

### Type definitions

```tsx
import type { ButtonProps } from "@/components/ui/Button";

interface MyComponentProps extends ButtonProps {
  // Your props
}
```

---

## Design System Alignment

The Button component follows the project's design system:

- **Colors**: Uses brand, neutral, success, warning, danger palettes
- **Typography**: Consistent font sizes and weights
- **Spacing**: Aligned with Tailwind's scale (px-3, py-2, etc.)
- **Shadows**: Consistent rounded corners (rounded-lg, rounded-md)
- **Animations**: Smooth transitions and active states

---

## Best Practices

### ✅ Do

- Use appropriate variants for the action type
- Always add `type="button"` for non-form buttons (handled automatically)
- Use `isLoading` for async operations
- Pair icon + text for clarity
- Use semantic size based on context

### ❌ Don't

- Don't add custom className overrides (use variants instead)
- Don't mix multiple Button variants in one row arbitrarily
- Don't use `disabled` + inline loading text (use `isLoading` prop)
- Don't ignore accessibility requirements

---

## Future Enhancements

Potential additions for future iterations:

- [ ] `fullWidth` prop for maximum width buttons
- [ ] `beforeIcon`/`afterIcon` for multiple icons
- [ ] `group` prop for button groups
- [ ] Tooltip integration
- [ ] Badge count support
- [ ] Animated transitions (slide, fade, etc.)

---

## Testing

All refactored components have been verified:

```bash
npm run build  # ✅ Compiled successfully
```

No TypeScript errors or warnings.

---

## Questions?

Refer to [Button.usage.md](./Button.usage.md) for detailed examples and patterns.
