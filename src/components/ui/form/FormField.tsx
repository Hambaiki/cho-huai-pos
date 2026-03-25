"use client";

import { ReactNode } from "react";

interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export function FormField({ children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {children}
    </div>
  );
}
