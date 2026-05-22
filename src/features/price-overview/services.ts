import { API_SERVICE } from "@/config/api";
import { getWithMeta } from "@/lib/request";

import type { PriceOverviewListData, PriceOverviewListParams } from "./types";

export async function listPriceOverview(params: PriceOverviewListParams = {}) {
  return getWithMeta<PriceOverviewListData>(API_SERVICE.priceOverview.list, {
    params,
  });
}
