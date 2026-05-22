import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBuyer, updateBuyer, updateBuyerProducts, updateBuyerRequirements } from "./services";
import {
  buyerKeys,
  buyerProductsQueryOptions,
  buyerRequirementsQueryOptions,
  buyersQueryOptions,
} from "./queries";
import type { BuyerFormValues, BuyerListParams, BuyerRequirementInput } from "./types";

export function useBuyersQuery(params: BuyerListParams = {}) {
  return useQuery(buyersQueryOptions(params));
}

export function useSaveBuyerMutation(buyerId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BuyerFormValues) =>
      buyerId ? updateBuyer(buyerId, input) : createBuyer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });
}

export function useBuyerProductsQuery(buyerId: number, enabled = true) {
  return useQuery(buyerProductsQueryOptions(buyerId, enabled));
}

export function useUpdateBuyerProductsMutation(buyerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: number[]) => updateBuyerProducts(buyerId, productIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerKeys.products(buyerId) });
      void queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });
}

export function useBuyerRequirementsQuery(buyerId: number, productId: number, enabled = true) {
  return useQuery(buyerRequirementsQueryOptions(buyerId, productId, enabled));
}

export function useUpdateBuyerRequirementsMutation(buyerId: number, productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requirements: BuyerRequirementInput[]) =>
      updateBuyerRequirements(buyerId, productId, requirements),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerKeys.requirements(buyerId, productId) });
      void queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });
}
