"use client";

import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui/react";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: BaseTabs.Root.Props) {
  return <BaseTabs.Root className={cn("w-full", className)} {...props} />;
}

function TabsList({ className, ...props }: BaseTabs.List.Props) {
  return (
    <BaseTabs.List
      className={cn(
        "inline-flex h-9 items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: BaseTabs.Tab.Props) {
  return (
    <BaseTabs.Tab
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium transition-all",
        "text-dusty-gray",
        "border-b-2 border-transparent",
        "data-[active]:border-ink-black data-[active]:text-ink-black",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: BaseTabs.Panel.Props) {
  return <BaseTabs.Panel className={cn("mt-4", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
