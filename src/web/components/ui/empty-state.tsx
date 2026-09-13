import * as React from "react";
import { LucideIcon, Music2 } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

/** Shared "nothing here yet" surface used across every MAUDIO screen. */
export function EmptyState({
  icon: Icon = Music2,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-border/60 bg-card/40",
        compact ? "py-8 px-4 gap-2" : "py-14 px-6 gap-3",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
