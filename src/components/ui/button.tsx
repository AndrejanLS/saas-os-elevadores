"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primary text-white hover:bg-navy-800 focus:ring-cyan-500",
      secondary: "border border-steel-300 bg-white text-navy-700 hover:bg-steel-50 focus:ring-steel-400",
      outline: "border border-steel-300 bg-transparent text-navy-700 hover:bg-steel-50 focus:ring-steel-400",
      ghost: "bg-transparent text-navy-700 hover:bg-steel-100 focus:ring-steel-400",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-12 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";