"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0" onClick={() => onOpenChange(false)}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-steel-400 hover:text-steel-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn("max-h-[calc(100vh-2rem)] overflow-y-auto", className)}>{children}</div>;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn("mb-6", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn("text-xl font-bold text-navy-950", className)}>{children}</h2>;
}