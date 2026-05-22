"use client";

import type { ReactElement } from "react";

import { PartnerEditorDialog } from "@/features/partners/components/partner-editor-dialog";

import { useSaveSupplierMutation } from "../hooks";
import type { Supplier, SupplierFormValues } from "../types";

type SupplierFormDialogProps = {
  supplier?: Supplier;
  trigger?: ReactElement;
};

export function SupplierFormDialog({ supplier, trigger }: SupplierFormDialogProps) {
  const saveSupplier = useSaveSupplierMutation(supplier?.id);

  async function handleSubmit(values: SupplierFormValues) {
    await saveSupplier.mutateAsync(values);
  }

  return (
    <PartnerEditorDialog
      kind="supplier"
      partner={supplier}
      trigger={trigger}
      isPending={saveSupplier.isPending}
      onSubmit={handleSubmit}
    />
  );
}
