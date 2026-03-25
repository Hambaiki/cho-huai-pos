# Button Component Usage Guide

## Overview
A flexible, shadcn/ui-style Button component with multiple variants, sizes, and states built with `class-variance-authority` (cva).

## Basic Usage

```tsx
import { Button } from "@/components/ui/Button";

// Default primary button
<Button>Click me</Button>

// With onClick handler
<Button onClick={handleClick}>Save</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

## Variants

### Primary (Default)
Used for main actions.
```tsx
<Button variant="primary">Primary Action</Button>
```

### Secondary
Used for secondary actions.
```tsx
<Button variant="secondary">Secondary Action</Button>
```

### Outline
Used for tertiary actions with border.
```tsx
<Button variant="outline">Outline Button</Button>
```

### Ghost
Minimal style, background-less.
```tsx
<Button variant="ghost">Ghost Button</Button>
```

### Destructive
Used for delete/remove actions.
```tsx
<Button variant="destructive">Delete</Button>
```

### Success
Used for positive completion actions.
```tsx
<Button variant="success">Confirm</Button>
```

### Warning
Used for cautionary actions.
```tsx
<Button variant="warning">Warning</Button>
```

## Sizes

- `sm`: Small (h-8, text-xs) - For compact UIs
- `md`: Medium (h-9, text-sm) - Default, most common
- `lg`: Large (h-10, text-base) - For emphasis
- `xl`: Extra Large (h-12, text-base) - For hero actions
- `icon`: Icon button (h-9 w-9) - For icon-only buttons
- `icon-sm`: Small icon (h-8 w-8)
- `icon-lg`: Large icon (h-10 w-10)

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="lg" variant="ghost" icon={<Trash2 size={18} />} />
```

## With Icons

### Icon on the left (default)
```tsx
<Button icon={<Plus size={16} />}>
  Add Item
</Button>
```

### Icon on the right
```tsx
<Button icon={<ChevronRight size={16} />} iconPosition="right">
  Next
</Button>
```

### Icon only
```tsx
<Button size="icon" icon={<Menu size={20} />} />
<Button size="icon" variant="ghost" icon={<X size={20} />} />
```

## Loading State

Use the `isLoading` prop to show a loading spinner and disable the button.

```tsx
const [isPending, startTransition] = useTransition();

<Button isLoading={isPending} onClick={handleSave}>
  Save
</Button>
```

The button will automatically:
- Show a spinning "Loader2" icon
- Disable interactions
- Maintain the placeholder space

## Common Patterns

### Form Submission Button
```tsx
<Button type="submit" isLoading={isPending}>
  {isPending ? "Saving..." : "Save Changes"}
</Button>
```

### Action Group (Side by side)
```tsx
<div className="flex gap-2">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button onClick={handleSubmit}>
    Confirm
  </Button>
</div>
```

### In Modal Footer
```tsx
<ModalFooter>
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="primary" onClick={handleSave}>
    Save
  </Button>
</ModalFooter>
```

### Destructive Action
```tsx
<Button 
  variant="destructive" 
  icon={<Trash2 size={16} />}
  onClick={confirmDelete}
>
  Delete Store
</Button>
```

### Quick Amount Selection (Toggle Style)
```tsx
{quickAmounts.map((amount) => (
  <Button
    key={amount}
    variant={selectedAmount === amount ? "active" : "outline"}
    size="sm"
    onClick={() => setSelectedAmount(amount)}
  >
    {formatCurrency(amount)}
  </Button>
))}
```

## Accessibility

The component includes:
- Full keyboard navigation support
- Focus ring visibility
- Proper disabled state handling
- ARIA attributes support (pass through any aria-* props)

## TypeScript

```tsx
interface MyComponentProps {
  // Pass through button props if needed
  buttonProps?: React.ComponentProps<typeof Button>;
}
```

## Migration from Inline Tailwind

### Before
```tsx
<button
  type="button"
  onClick={handleClick}
  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
>
  <CirclePlus size={16} />
  New Store
</button>
```

### After
```tsx
<Button 
  icon={<CirclePlus size={16} />}
  onClick={handleClick}
>
  New Store
</Button>
```

Much cleaner and more maintainable!
