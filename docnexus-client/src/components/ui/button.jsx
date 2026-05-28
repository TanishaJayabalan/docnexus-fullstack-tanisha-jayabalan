import { cn } from "@/lib/utils";
import { cloneElement, isValidElement } from "react";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-background hover:bg-muted",
  ghost: "hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function Button({ asChild = false, children, className, variant = "default", size = "default", ...props }) {
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    icon: "h-9 w-9",
  };

  const buttonClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn(buttonClassName, children.props.className),
      ...props,
    });
  }

  return (
    <button className={buttonClassName} {...props}>
      {children}
    </button>
  );
}
