import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
        secondary:
          "border border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
        outline:
          "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100",
        active:
          "border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200",
        ghost:
          "border border-transparent text-neutral-700 hover:bg-neutral-200 active:bg-neutral-200",
        ghostDark:
          "border border-transparent text-white hover:bg-neutral-700/10 active:bg-neutral-700/20",
        destructive:
          "border border-transparent bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800",
        success:
          "border border-transparent bg-success-600 text-white hover:bg-success-700 active:bg-success-800",
        warning:
          "border border-transparent bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800",
      },
      size: {
        sm: "py-2 px-3 text-xs rounded-md",
        md: "py-2 px-4 text-sm rounded-md",
        lg: "py-3 px-6 text-base rounded-lg",
        xl: "py-3 px-8 text-base rounded-lg",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      icon,
      iconPosition = "left",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    const iconElement = isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      icon
    );

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {iconElement && iconPosition === "left" && (
          <span className={cn(children && "mr-2")}>{iconElement}</span>
        )}

        {children}

        {iconElement && iconPosition === "right" && (
          <span className={cn(children && "ml-2")}>{iconElement}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
