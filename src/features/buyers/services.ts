import { API_SERVICE } from "@/config/api";
import { get, getWithMeta, post, put } from "@/lib/request";

import type {
  Buyer,
  BuyerFormValues,
  BuyerListParams,
  BuyerProduct,
  BuyerRequirement,
  BuyerRequirementInput,
} from "./types";

export async function listBuyers(params: BuyerListParams = {}) {
  return getWithMeta<Buyer[]>(API_SERVICE.buyers.list, { params });
}

export async function createBuyer(input: BuyerFormValues) {
  return post<Buyer, BuyerFormValues>(API_SERVICE.buyers.list, input);
}

export async function updateBuyer(id: number, input: BuyerFormValues) {
  return put<Buyer, BuyerFormValues>(API_SERVICE.buyers.detail(id), input);
}

export async function listBuyerProducts(buyerId: number) {
  return get<BuyerProduct[]>(API_SERVICE.buyers.products(buyerId));
}

export async function updateBuyerProducts(buyerId: number, productIds: number[]) {
  return put<BuyerProduct[], { productIds: number[] }>(API_SERVICE.buyers.products(buyerId), {
    productIds,
  });
}

export async function listBuyerRequirements(buyerId: number, productId: number) {
  return get<BuyerRequirement[]>(API_SERVICE.buyers.requirements(buyerId, productId));
}

export async function updateBuyerRequirements(
  buyerId: number,
  productId: number,
  requirements: BuyerRequirementInput[],
) {
  return put<BuyerRequirement[], { requirements: BuyerRequirementInput[] }>(
    API_SERVICE.buyers.requirements(buyerId, productId),
    { requirements },
  );
}
