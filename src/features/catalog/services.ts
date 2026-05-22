import { API_SERVICE } from "@/config/api";
import { get, getWithMeta } from "@/lib/request";

import type { Product, ProductListParams, ProductMetric } from "./types";

export async function listProducts(params: ProductListParams = {}) {
  return getWithMeta<Product[]>(API_SERVICE.products.list, { params });
}

export async function getProductMetrics(productId: number) {
  return get<ProductMetric[]>(API_SERVICE.products.metrics(productId));
}
