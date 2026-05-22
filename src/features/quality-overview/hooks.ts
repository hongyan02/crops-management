import { useQuery } from "@tanstack/react-query";

import { qualityOverviewQueryOptions } from "./queries";
import type { QualityOverviewListParams } from "./types";

export function useQualityOverviewQuery(params: QualityOverviewListParams = {}) {
  return useQuery(qualityOverviewQueryOptions(params));
}
