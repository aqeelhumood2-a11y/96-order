import * as RadixLabel from "@radix-ui/react-label";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "@/lib/cn";

export const Label = forwardRef<ElementRef<typeof RadixLabel.Root>, ComponentPropsWithoutRef<typeof RadixLabel.Root>>(
  ({ className, ...props }, ref) => (
    <RadixLabel.Root ref={ref} className={cn("text-sm font-medium text-foreground", className)} {...props} />
  ),
);
Label.displayName = "Label";
