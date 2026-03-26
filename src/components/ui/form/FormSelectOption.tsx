"use client";

import { ReactNode } from "react";

export interface FormSelectOptionProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * FormSelectOption is used as a child of FormSelect to define options.
 * Similar to the native <option> element, but works with the custom FormSelect component.
 *
 * @example
 * ```tsx
 * <FormSelect value={selected} onChange={setSelected}>
 *   <FormSelectOption value="option1">Option 1</FormSelectOption>
 *   <FormSelectOption value="option2">Option 2</FormSelectOption>
 *   <FormSelectOption value="option3" disabled>Option 3 (Disabled)</FormSelectOption>
 * </FormSelect>
 * ```
 */
export function FormSelectOption({
  value: _value, // eslint-disable-line @typescript-eslint/no-unused-vars
  disabled: _disabled, // eslint-disable-line @typescript-eslint/no-unused-vars
  children: _children, // eslint-disable-line @typescript-eslint/no-unused-vars
}: FormSelectOptionProps) {
  // NOTE: This component itself doesn't render anything.
  // It's purely a data structure that FormSelect extracts via React.Children.toArray.
  // This pattern allows intuitive JSX usage similar to native <select>/<option>.
  return null;
}

FormSelectOption.displayName = "FormSelectOption";
