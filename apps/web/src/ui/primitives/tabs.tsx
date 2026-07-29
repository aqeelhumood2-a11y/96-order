"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn("inline-flex items-center gap-1 rounded-md bg-brand-50 p-1", className)}
    {...props}
  />
));
TabsList.displayName = RadixTabs.List.displayName;

export const TabsTrigger = forwardRef<
  ElementRef<typeof RadixTabs.Trigger>,
  ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "rounded-sm px-3 py-1.5 text-sm font-medium text-brand-900 transition-colors data-[state=active]:bg-background data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = RadixTabs.Trigger.displayName;

export const TabsContent = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn("mt-3 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = RadixTabs.Content.displayName;
