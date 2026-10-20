import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Simple label + control + error wrapper used with react-hook-form. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
  required,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor} className="text-neutral-700">
          {label}
          {required ? <span className="text-brand"> *</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
