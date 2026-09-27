"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-steel-400",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-steel-50",
          "transition-colors",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";