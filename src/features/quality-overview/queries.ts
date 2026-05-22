import { queryOptions } from "@tanstack/react-query";

import { listQualityOverview } from "./services";
import type { QualityOverviewListParams } from "./types";

export const qualityOverviewKeys = {
  all: ["qualityOverview"] as const,
  lists: () => [...qualityOverviewKeys.all, "list"] as const,
  list: (params: QualityOverviewListParams = {}) =>
    [...qualityOverviewKeys.lists(), params] as const,
};

export function qualityOverviewQueryOptions(params: QualityOverviewListParams = {}) {
  return queryOptions({
    queryKey: qualityOverviewKeys.list(params),
    queryFn: () => listQualityOverview(params),
  });
}
