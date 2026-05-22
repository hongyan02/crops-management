"use client";

import { useMemo, useState } from "react";

import { PartnerProductSelectorDialog } from "@/features/partners/components/partner-product-selector-dialog";
import { useProductsQuery } from "@/features/catalog/hooks";
import { ApiRequestError } from "@/lib/request";

import { useBuyerProductsQuery, useUpdateBuyerProductsMutation } from "../hooks";
import type { Buyer } from "../types";

type BuyerProductsDialogProps = {
  buyer: Buyer;
};

export function BuyerProductsDialog({ buyer }: BuyerProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const productsQuery = useProductsQuery({ pageSize: 200 });
  const buyerProductsQuery = useBuyerProductsQuery(buyer.id, open);
  const updateBuyerProducts = useUpdateBuyerProductsMutation(buyer.id);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data]);
  const boundProductIds = useMemo(
    () => buyerProductsQuery.data?.map((product) => product.id) ?? [],
    [buyerProductsQuery.data],
  );
  const effectiveSelectedIds = selectedIds ?? boundProductIds;
  const loading = productsQuery.isLoading || buyerProductsQuery.isLoading;
  const queryError = productsQuery.error ?? buyerProductsQuery.error;
  const errorMessage = serverError ?? (queryError instanceof Error ? queryError.message : null);

  function toggleProduct(productId: number, checked: boolean) {
    setSelectedIds((current) => {
      const currentIds = current ?? boundProductIds;
      return checked
        ? currentIds.includes(productId)
          ? currentIds
          : [...currentIds, productId]
        : currentIds.filter((id) => id !== productId);
    });
  }

  async function handleSave() {
    setServerError(null);

    try {
      await updateBuyerProducts.mutateAsync(effectiveSelectedIds);
      setOpen(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "保存失败");
    }
  }

  return (
    <PartnerProductSelectorDialog
      kind="buyer"
      partnerName={buyer.name}
      products={products}
      selectedIds={effectiveSelectedIds}
      loading={loading}
      saving={updateBuyerProducts.isPending}
      errorMessage={errorMessage}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setServerError(null);
        if (!nextOpen) {
          setSelectedIds(null);
        }
      }}
      onToggleProduct={toggleProduct}
      onSave={handleSave}
    />
  );
}
