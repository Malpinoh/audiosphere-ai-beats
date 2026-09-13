import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Persistent, screen-reader-announced error surface with an inline retry.
 * Replaces toast-only error signalling.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Please try again.",
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-destructive/30 bg-destructive/5",
        compact ? "py-8 px-4 gap-2" : "py-12 px-6 gap-3",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
