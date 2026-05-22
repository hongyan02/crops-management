import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupplier,
  createSupplierQuality,
  updateSupplier,
  updateSupplierProducts,
} from "./services";
import {
  supplierKeys,
  supplierProductsQueryOptions,
  supplierQualityQueryOptions,
  suppliersQueryOptions,
} from "./queries";
import type {
  SupplierFormValues,
  SupplierListParams,
  SupplierQualityBatchInput,
} from "./types";

export function useSuppliersQuery(params: SupplierListParams = {}, enabled = true) {
  return useQuery(suppliersQueryOptions(params, enabled));
}

export function useSaveSupplierMutation(supplierId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SupplierFormValues) =>
      supplierId ? updateSupplier(supplierId, input) : createSupplier(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useSupplierProductsQuery(supplierId: number, enabled = true) {
  return useQuery(supplierProductsQueryOptions(supplierId, enabled));
}

export function useUpdateSupplierProductsMutation(supplierId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: number[]) => updateSupplierProducts(supplierId, productIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.products(supplierId) });
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useSupplierQualityQuery(
  supplierId: number,
  productId: number,
  enabled = true,
) {
  return useQuery(supplierQualityQueryOptions(supplierId, productId, enabled));
}

export function useCreateSupplierQualityMutation(supplierId: number, productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SupplierQualityBatchInput) =>
      createSupplierQuality(supplierId, productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.quality(supplierId, productId) });
      void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ["qualityOverview"] });
    },
  });
}
