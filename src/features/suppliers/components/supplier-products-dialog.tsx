"use client";

import { type ReactElement, useMemo, useState } from "react";

import { PartnerProductSelectorDialog } from "@/features/partners/components/partner-product-selector-dialog";
import { useProductsQuery } from "@/features/catalog/hooks";
import { ApiRequestError } from "@/lib/request";

import { useSupplierProductsQuery, useUpdateSupplierProductsMutation } from "../hooks";
import type { Supplier } from "../types";

type SupplierProductsDialogProps = {
  supplier: Supplier;
  trigger?: ReactElement;
};

export function SupplierProductsDialog({ supplier, trigger }: SupplierProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const productsQuery = useProductsQuery({ pageSize: 200 });
  const supplierProductsQuery = useSupplierProductsQuery(supplier.id, open);
  const updateSupplierProducts = useUpdateSupplierProductsMutation(supplier.id);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data]);
  const boundProductIds = useMemo(
    () => supplierProductsQuery.data?.map((product) => product.id) ?? [],
    [supplierProductsQuery.data],
  );
  const effectiveSelectedIds = selectedIds ?? boundProductIds;
  const loading = productsQuery.isLoading || supplierProductsQuery.isLoading;
  const queryError = productsQuery.error ?? supplierProductsQuery.error;
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
      await updateSupplierProducts.mutateAsync(effectiveSelectedIds);
      setOpen(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : "保存失败");
    }
  }

  return (
    <PartnerProductSelectorDialog
      kind="supplier"
      partnerName={supplier.name}
      products={products}
      selectedIds={effectiveSelectedIds}
      loading={loading}
      saving={updateSupplierProducts.isPending}
      errorMessage={errorMessage}
      open={open}
      trigger={trigger}
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
