import { queryOptions } from "@tanstack/react-query";

import { listQualityMetrics } from "./services";
import type { QualityMetricListParams } from "./types";

export const qualityMetricKeys = {
  all: ["quality-metrics"] as const,
  lists: () => [...qualityMetricKeys.all, "list"] as const,
  list: (params: QualityMetricListParams = {}) => [...qualityMetricKeys.lists(), params] as const,
};

export function qualityMetricsQueryOptions(params: QualityMetricListParams = {}) {
  return queryOptions({
    queryKey: qualityMetricKeys.list(params),
    queryFn: () => listQualityMetrics(params),
  });
}
