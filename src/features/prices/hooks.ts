import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createPrice } from "./services";
import { priceHistoryQueryOptions, priceKeys, pricesQueryOptions } from "./queries";
import type { CreatePriceInput, PriceListParams } from "./types";

export function usePricesQuery(params: PriceListParams = {}) {
  return useQuery(pricesQueryOptions(params));
}

export function usePriceHistoryQuery(
  supplierId: number,
  productId: number,
  enabled = true,
) {
  return useQuery(priceHistoryQueryOptions(supplierId, productId, enabled));
}

export function useCreatePriceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePriceInput) => createPrice(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: priceKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: priceKeys.history(variables.supplierId, variables.productId),
      });
      void queryClient.invalidateQueries({ queryKey: ["priceOverview"] });
    },
  });
}
