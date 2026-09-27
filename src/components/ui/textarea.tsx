"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[100px] w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-steel-400 resize-y",
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
Textarea.displayName = "Textarea";