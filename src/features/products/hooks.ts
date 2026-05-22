import { useMutation, useQueryClient } from "@tanstack/react-query";

import { catalogKeys } from "@/features/catalog/queries";
import { createProduct, updateProductMetrics } from "./services";
import type { ProductFormValues } from "./types";

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductFormValues) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
    },
  });
}

export function useUpdateProductMetricsMutation(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metricIds: number[]) => updateProductMetrics(productId, metricIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.metrics(productId) });
    },
  });
}
