import { useQuery } from "@tanstack/react-query";

import { priceOverviewQueryOptions } from "./queries";
import type { PriceOverviewListParams } from "./types";

export function usePriceOverviewQuery(params: PriceOverviewListParams = {}) {
  return useQuery(priceOverviewQueryOptions(params));
}
