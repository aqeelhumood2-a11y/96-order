import type { ReactNode } from "react";
import { Logo } from "@/ui/layout/logo";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-surface-border px-6 py-16 text-center">
      <Logo variant="mark" color="purple" height={32} className="opacity-30" />
      <p className="text-base font-medium text-brand-950">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground/69">{description}</p>}
      {action}
    </div>
  );
}
