import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createQualityMetric, updateQualityMetric } from "./services";
import { qualityMetricKeys, qualityMetricsQueryOptions } from "./queries";
import type { QualityMetricFormValues, QualityMetricListParams } from "./types";

export function useQualityMetricsQuery(params: QualityMetricListParams = {}) {
  return useQuery(qualityMetricsQueryOptions(params));
}

export function useSaveQualityMetricMutation(metricId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QualityMetricFormValues) =>
      metricId ? updateQualityMetric(metricId, input) : createQualityMetric(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qualityMetricKeys.lists() });
    },
  });
}
