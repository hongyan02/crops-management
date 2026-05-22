import { queryOptions } from "@tanstack/react-query";

import { getProductMetrics, listProducts } from "./services";
import type { ProductListParams } from "./types";

export const catalogKeys = {
  all: ["products"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: (params: ProductListParams = {}) => [...catalogKeys.lists(), params] as const,
  metrics: (productId: number) => [...catalogKeys.all, "metrics", productId] as const,
};

export function productsQueryOptions(params: ProductListParams = {}) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: () => listProducts(params),
  });
}

export function productMetricsQueryOptions(productId: number, enabled = true) {
  return queryOptions({
    queryKey: catalogKeys.metrics(productId),
    queryFn: () => getProductMetrics(productId),
    enabled,
  });
}
