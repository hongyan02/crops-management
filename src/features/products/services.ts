import { API_SERVICE } from "@/config/api";
import { post, put } from "@/lib/request";
import type { Product, ProductMetric } from "@/features/catalog/types";

import type { ProductFormValues } from "./types";

export async function createProduct(input: ProductFormValues) {
  return post<Product, ProductFormValues>(API_SERVICE.products.list, input);
}

export async function updateProductMetrics(productId: number, metricIds: number[]) {
  return put<ProductMetric[], { metricIds: number[] }>(API_SERVICE.products.metrics(productId), {
    metricIds,
  });
}
