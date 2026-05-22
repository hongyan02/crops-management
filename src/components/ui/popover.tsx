"use client";

import * as React from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function Popover({ ...props }: BasePopover.Root.Props) {
  return <BasePopover.Root {...props} />;
}

function PopoverTrigger({ ...props }: BasePopover.Trigger.Props) {
  return <BasePopover.Trigger {...props} />;
}

function PopoverContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: BasePopover.Popup.Props & {
  sideOffset?: number;
}) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner align="start" sideOffset={sideOffset}>
        <BasePopover.Popup
          className={cn(
            "z-50 w-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-hidden data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
