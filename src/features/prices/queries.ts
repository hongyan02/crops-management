import { queryOptions } from "@tanstack/react-query";

import { listPriceHistory, listPrices } from "./services";
import type { PriceListParams } from "./types";

export const priceKeys = {
  all: ["prices"] as const,
  lists: () => [...priceKeys.all, "list"] as const,
  list: (params: PriceListParams = {}) => [...priceKeys.lists(), params] as const,
  history: (supplierId: number, productId: number) =>
    [...priceKeys.all, "history", supplierId, productId] as const,
};

export function pricesQueryOptions(params: PriceListParams = {}) {
  return queryOptions({
    queryKey: priceKeys.list(params),
    queryFn: () => listPrices(params),
  });
}

export function priceHistoryQueryOptions(
  supplierId: number,
  productId: number,
  enabled = true,
) {
  return queryOptions({
    queryKey: priceKeys.history(supplierId, productId),
    queryFn: () => listPriceHistory(supplierId, productId),
    enabled,
  });
}
