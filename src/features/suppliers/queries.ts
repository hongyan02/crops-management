import { queryOptions } from "@tanstack/react-query";

import { listSupplierProducts, listSupplierQuality, listSuppliers } from "./services";
import type { SupplierListParams } from "./types";

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params: SupplierListParams = {}) => [...supplierKeys.lists(), params] as const,
  products: (supplierId: number) => [...supplierKeys.all, "products", supplierId] as const,
  quality: (supplierId: number, productId: number) =>
    [...supplierKeys.all, "quality", supplierId, productId] as const,
};

export function suppliersQueryOptions(params: SupplierListParams = {}, enabled = true) {
  return queryOptions({
    queryKey: supplierKeys.list(params),
    queryFn: () => listSuppliers(params),
    enabled,
  });
}

export function supplierProductsQueryOptions(supplierId: number, enabled = true) {
  return queryOptions({
    queryKey: supplierKeys.products(supplierId),
    queryFn: () => listSupplierProducts(supplierId),
    enabled,
  });
}

export function supplierQualityQueryOptions(
  supplierId: number,
  productId: number,
  enabled = true,
) {
  return queryOptions({
    queryKey: supplierKeys.quality(supplierId, productId),
    queryFn: () => listSupplierQuality(supplierId, productId),
    enabled,
  });
}
