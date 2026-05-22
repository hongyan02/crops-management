import { useQuery } from "@tanstack/react-query";

import { productMetricsQueryOptions, productsQueryOptions } from "./queries";
import type { ProductListParams } from "./types";

export function useProductsQuery(params: ProductListParams = {}) {
  return useQuery(productsQueryOptions(params));
}

export function useProductMetricsQuery(productId: number, enabled = true) {
  return useQuery(productMetricsQueryOptions(productId, enabled));
}
