"use client";

import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: BaseDialog.Root.Props) {
  return <BaseDialog.Root {...props} />;
}

function DialogTrigger({ ...props }: BaseDialog.Trigger.Props) {
  return <BaseDialog.Trigger {...props} />;
}

function DialogPortal({ ...props }: BaseDialog.Portal.Props) {
  return <BaseDialog.Portal {...props} />;
}

function DialogClose({ ...props }: BaseDialog.Close.Props) {
  return <BaseDialog.Close {...props} />;
}

function DialogOverlay({ className, ...props }: BaseDialog.Backdrop.Props) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: BaseDialog.Popup.Props) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[9.6px] border border-parchment bg-vellum-white p-6 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: BaseDialog.Title.Props) {
  return (
    <BaseDialog.Title
      className={cn("text-lg font-medium text-ink-black", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: BaseDialog.Description.Props) {
  return (
    <BaseDialog.Description
      className={cn("text-sm text-dusty-gray", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex justify-end gap-2 pt-4", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
