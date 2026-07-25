"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  /** Label for the primary call-to-action that nudges the next step. */
  actionLabel?: string;
  /** Handler for the call-to-action. When omitted, no button is rendered. */
  onAction?: () => void;
  /** Renders the action disabled (e.g. a "coming soon" feature). */
  disabled?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && (
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            disabled={disabled || !onAction}
          >
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
