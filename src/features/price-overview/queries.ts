import { queryOptions } from "@tanstack/react-query";

import { listPriceOverview } from "./services";
import type { PriceOverviewListParams } from "./types";

export const priceOverviewKeys = {
  all: ["priceOverview"] as const,
  lists: () => [...priceOverviewKeys.all, "list"] as const,
  list: (params: PriceOverviewListParams = {}) =>
    [...priceOverviewKeys.lists(), params] as const,
};

export function priceOverviewQueryOptions(params: PriceOverviewListParams = {}) {
  return queryOptions({
    queryKey: priceOverviewKeys.list(params),
    queryFn: () => listPriceOverview(params),
  });
}
