import { Button } from "@/ui/primitives";

export interface ListingErrorProps {
  onRetry?: () => void;
}

/** Generic catalog-load failure — deliberately vague (no stack traces or internal details reach the browser). */
export function ListingError({ onRetry }: ListingErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-red-200 px-6 py-16 text-center">
      <p className="text-base font-medium text-brand-950">Something went wrong loading products</p>
      <p className="max-w-sm text-sm text-foreground/60">Please try again in a moment.</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
