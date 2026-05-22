import { queryOptions } from "@tanstack/react-query";

import { listBuyerProducts, listBuyerRequirements, listBuyers } from "./services";
import type { BuyerListParams } from "./types";

export const buyerKeys = {
  all: ["buyers"] as const,
  lists: () => [...buyerKeys.all, "list"] as const,
  list: (params: BuyerListParams = {}) => [...buyerKeys.lists(), params] as const,
  products: (buyerId: number) => [...buyerKeys.all, "products", buyerId] as const,
  requirements: (buyerId: number, productId: number) =>
    [...buyerKeys.all, "requirements", buyerId, productId] as const,
};

export function buyersQueryOptions(params: BuyerListParams = {}) {
  return queryOptions({
    queryKey: buyerKeys.list(params),
    queryFn: () => listBuyers(params),
  });
}

export function buyerProductsQueryOptions(buyerId: number, enabled = true) {
  return queryOptions({
    queryKey: buyerKeys.products(buyerId),
    queryFn: () => listBuyerProducts(buyerId),
    enabled,
  });
}

export function buyerRequirementsQueryOptions(
  buyerId: number,
  productId: number,
  enabled = true,
) {
  return queryOptions({
    queryKey: buyerKeys.requirements(buyerId, productId),
    queryFn: () => listBuyerRequirements(buyerId, productId),
    enabled,
  });
}
