import { API_SERVICE } from "@/config/api";
import { get, getWithMeta, post } from "@/lib/request";

import type {
  CreatePriceInput,
  LatestSupplierProductPriceRow,
  PriceHistoryRecord,
  PriceListParams,
} from "./types";

export async function listPrices(params: PriceListParams = {}) {
  return getWithMeta<LatestSupplierProductPriceRow[]>(API_SERVICE.prices.list, {
    params,
  });
}

export async function createPrice(input: CreatePriceInput) {
  return post<PriceHistoryRecord, CreatePriceInput>(API_SERVICE.prices.list, input);
}

export async function listPriceHistory(supplierId: number, productId: number) {
  return get<PriceHistoryRecord[]>(API_SERVICE.prices.history, {
    params: {
      supplierId,
      productId,
    },
  });
}
