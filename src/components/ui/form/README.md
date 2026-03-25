# Form Components Guide

This guide explains how to use the modular form components library in your project for consistent, maintainable, and scalable form implementations.

## Overview

The form components library provides a set of composable, reusable components following shadcn/ui patterns. All components are located in `src/components/ui/form/`.

### Available Components

- **`FormField`** - Wrapper for form groups (adds spacing and organization)
- **`FormLabel`** - Consistent label component with required indicator support
- **`FormInput`** - Text input with error states and accessibility
- **`FormSelect`** - Select dropdown with error states
- **`FormTextarea`** - Textarea with error states
- **`FormError`** - Error message display component
- **`FormHelp`** - Helper/hint text component
- **`FormCheckbox`** - Checkbox input with label

## Basic Usage

### Simple Form

```tsx
"use client";

import { useActionState } from "react";
import { myAction } from "@/lib/actions/my-action";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/form";

export default function MyForm() {
  const [state, formAction, isPending] = useActionState(myAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <FormField>
        <FormLabel htmlFor="email" required>
          Email
        </FormLabel>
        <FormInput
          id="email"
          name="email"
          type="email"
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="message">Message</FormLabel>
        <FormInput
          id="message"
          name="message"
          placeholder="Optional message..."
        />
      </FormField>

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## Component Reference

### FormField

Container for a form group with consistent spacing.

```tsx
<FormField>
  <FormLabel>Field Label</FormLabel>
  <FormInput />
</FormField>

<FormField className="col-span-2">
  {/* custom spacing or layout */}
</FormField>
```

**Props:**
- `children`: ReactNode - Form content
- `className`: string (optional) - Additional CSS classes

---

### FormLabel

Renders a label with optional required indicator.

```tsx
// Simple label
<FormLabel htmlFor="name">Name</FormLabel>

// With required indicator (shows red asterisk)
<FormLabel htmlFor="email" required>
  Email
</FormLabel>

// With icon
<FormLabel htmlFor="phone">
  <Phone size={16} />
  Phone
</FormLabel>
```

**Props:**
- `required`: boolean (optional) - Show required indicator
- `htmlFor`: string - ID of associated input
- `children`: React.ReactNode - Label text
- Standard HTML label attributes (id, className, etc.)

---

### FormInput

Flexible input component supporting all input types with error state handling.

```tsx
// Text input
<FormInput
  id="name"
  name="name"
  type="text"
  placeholder="Enter your name"
/>

// Email
<FormInput
  id="email"
  name="email"
  type="email"
  required
/>

// Number with constraints
<FormInput
  id="age"
  name="age"
  type="number"
  min="0"
  max="120"
  step="1"
/>

// Currency
<FormInput
  id="price"
  name="price"
  type="number"
  step="0.01"
  min="0"
/>

// Password
<FormInput
  id="password"
  name="password"
  type="password"
  autoComplete="new-password"
/>

// With error state
<FormInput
  id="username"
  name="username"
  error={!!state.error}
  disabled={isPending}
/>
```

**Props:**
- `type`: string - Input type (default: "text")
- `error`: boolean (optional) - Highlight with error styling
- `isLoading`: boolean (optional) - Disable and show loading state
- All standard HTML input attributes

---

### FormSelect

Dropdown select component with consistent styling.

```tsx
// Basic select with options prop
<FormSelect
  id="category"
  name="category"
  options={[
    { value: "electronics", label: "Electronics" },
    { value: "books", label: "Books" },
  ]}
/>

// Select with children elements
<FormSelect
  id="status"
  name="status"
  defaultValue="active"
>
  <option value="">Select status...</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</FormSelect>

// With error state
<FormSelect
  id="role"
  name="role"
  error={!!state.error}
>
  <option value="">Choose role...</option>
  <option value="admin">Admin</option>
  <option value="user">User</option>
</FormSelect>
```

**Props:**
- `options`: Array<{value: string, label: ReactNode}> (optional)
- `children`: ReactNode (optional) - Option elements
- `error`: boolean (optional)
- `isLoading`: boolean (optional)
- All standard HTML select attributes

---

### FormTextarea

Textarea component for longer text input.

```tsx
// Basic textarea
<FormTextarea
  id="description"
  name="description"
  placeholder="Enter description..."
  rows={5}
/>

// With character limit
<FormTextarea
  id="notes"
  name="notes"
  maxLength={500}
  placeholder="Max 500 characters"
/>

// With error state
<FormTextarea
  id="message"
  name="message"
  error={!!state.error}
  disabled={isPending}
/>
```

**Props:**
- `error`: boolean (optional)
- `isLoading`: boolean (optional)
- All standard HTML textarea attributes

---

### FormError

Display validation or submission errors with icon.

```tsx
// Show error if it exists
<FormError message={state.error} />

// Will render nothing if message is null/undefined
<FormError message={undefined} />

// With custom styling
<FormError
  message={state.error}
  className="mt-2 bg-danger-50 p-2 rounded"
/>
```

**Props:**
- `message`: string | null (optional) - Error message to display
- `className`: string (optional) - Additional CSS classes

---

### FormHelp

Display hint text or helper information below an input.

```tsx
<FormField>
  <FormLabel htmlFor="password">Password</FormLabel>
  <FormInput id="password" name="password" type="password" />
  <FormHelp message="Must be at least 8 characters" />
</FormField>

// Only shows if message is provided
<FormHelp message={undefined} />
```

**Props:**
- `message`: string (optional) - Help text to display
- `className`: string (optional) - Additional CSS classes

---

### FormCheckbox

Checkbox with integrated label.

```tsx
// Basic checkbox
<FormCheckbox
  id="agree"
  name="agree"
/>

// With label
<FormCheckbox
  id="terms"
  name="terms"
  label="I agree to the terms and conditions"
  required
/>

// Disabled state
<FormCheckbox
  id="newsletter"
  name="newsletter"
  label="Subscribe to newsletter"
  disabled
/>
```

**Props:**
- `label`: React.ReactNode (optional) - Label text
- All standard HTML checkbox input attributes

---

## Common Patterns

### Grid Layout (2 columns on desktop, 1 on mobile)

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
  <FormField>
    <FormLabel htmlFor="firstName" required>First Name</FormLabel>
    <FormInput id="firstName" name="firstName" required />
  </FormField>

  <FormField>
    <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
    <FormInput id="lastName" name="lastName" required />
  </FormField>
</div>
```

### Form with Select and Help Text

```tsx
<FormField>
  <FormLabel htmlFor="role" required>
    User Role
  </FormLabel>
  <FormSelect
    id="role"
    name="role"
    required
    defaultValue="user"
  >
    <option value="admin">Administrator</option>
    <option value="manager">Manager</option>
    <option value="user">User</option>
  </FormSelect>
  <FormHelp message="Admins have full system access" />
</FormField>
```

### Error Handling with Multiple Fields

```tsx
<FormField>
  <FormLabel htmlFor="email" required>
    Email
  </FormLabel>
  <FormInput
    id="email"
    name="email"
    type="email"
    required
    error={state.fieldErrors?.email !== undefined}
  />
  <FormError message={state.fieldErrors?.email} />
</FormField>
```

### Disabled/Loading State

```tsx
<FormField>
  <FormLabel htmlFor="submit">Submit</FormLabel>
  <FormInput
    id="data"
    name="data"
    isLoading={isPending}
    disabled={isPending}
  />
</FormField>

<button disabled={isPending}>
  {isPending ? "Loading..." : "Submit"}
</button>
```

## Styling & Customization

All form components use Tailwind CSS and follow the design system colors:

- **Borders**: `border-neutral-200` (default), `border-danger-300` (error)
- **Text**: `text-neutral-900` (input), `text-neutral-700` (labels), `text-neutral-500` (help)
- **Focus Ring**: `focus:ring-brand-200` (default), `focus:ring-danger-200` (error)
- **Disabled**: `disabled:bg-neutral-50`, `disabled:text-neutral-500`

### Override default styles

```tsx
<FormInput
  className="uppercase text-lg"
  {...otherProps}
/>
```

## Migration Guide

If you have existing forms using raw HTML inputs, follow this pattern:

### Before

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-neutral-700" htmlFor="name">
    Name *
  </label>
  <input
    type="text"
    id="name"
    name="name"
    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
    required
  />
</div>
```

### After

```tsx
<FormField>
  <FormLabel htmlFor="name" required>
    Name
  </FormLabel>
  <FormInput
    id="name"
    name="name"
    required
  />
</FormField>
```

## Best Practices

1. **Always use FormField** to wrap label + input combinations for consistent spacing
2. **Use FormError** for displaying validation errors instead of custom error divs
3. **Use FormHelp** for additional context or requirements (e.g., "Min 8 characters")
4. **Required fields**: Use `required` prop on FormLabel AND the input element
5. **Error states**: Pass error prop to FormInput when field has validation errors
6. **Loading states**: Use `isLoading` prop or `disabled` attribute during submission
7. **Keep labels concise** - let help text provide additional context
8. **Use proper input types** - `type="email"`, `type="tel"`, `type="number"`, etc.
9. **Provide meaningful placeholders** only when it helps clarify input
10. **Group related fields** in visual sections with `<div className="space-y-4">`

## Future Enhancements

Possible additions to the form component library:

- `FormRadioGroup` - Radio button groups
- `FormMultiSelect` - Multi-select component
- `FormDatePicker` - Date input with calendar
- `FormFileUpload` - File input with preview
- `FormFieldArray` - Dynamic field arrays for repeating fields
- Form-level validation components
- Accessibility enhancements (ARIA labels, descriptions)
