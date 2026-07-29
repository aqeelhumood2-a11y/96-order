"use client";

import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;
export const DropdownMenuPortal = RadixDropdownMenu.Portal;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPortal>
    <RadixDropdownMenu.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-40 rounded-md border border-brand-100 bg-background p-1 shadow-md",
        className,
      )}
      {...props}
    />
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = RadixDropdownMenu.Content.displayName;

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item>
>(({ className, ...props }, ref) => (
  <RadixDropdownMenu.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-brand-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = RadixDropdownMenu.Item.displayName;

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdownMenu.Separator
    ref={ref}
    className={cn("my-1 h-px bg-brand-100", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = RadixDropdownMenu.Separator.displayName;
