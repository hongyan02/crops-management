"use client";

import type { ReactElement } from "react";

import { PartnerEditorDialog } from "@/features/partners/components/partner-editor-dialog";

import { useSaveBuyerMutation } from "../hooks";
import type { Buyer, BuyerFormValues } from "../types";

type BuyerFormDialogProps = {
  buyer?: Buyer;
  trigger?: ReactElement;
};

export function BuyerFormDialog({ buyer, trigger }: BuyerFormDialogProps) {
  const saveBuyer = useSaveBuyerMutation(buyer?.id);

  async function handleSubmit(values: BuyerFormValues) {
    await saveBuyer.mutateAsync(values);
  }

  return (
    <PartnerEditorDialog
      kind="buyer"
      partner={buyer}
      trigger={trigger}
      isPending={saveBuyer.isPending}
      onSubmit={handleSubmit}
    />
  );
}
