import { API_SERVICE } from "@/config/api";
import { getWithMeta, post, put } from "@/lib/request";

import type {
  QualityMetric,
  QualityMetricFormValues,
  QualityMetricListParams,
} from "./types";

export async function listQualityMetrics(params: QualityMetricListParams = {}) {
  return getWithMeta<QualityMetric[]>(API_SERVICE.qualityMetrics.list, { params });
}

export async function createQualityMetric(input: QualityMetricFormValues) {
  return post<QualityMetric, QualityMetricFormValues>(API_SERVICE.qualityMetrics.list, input);
}

export async function updateQualityMetric(id: number, input: QualityMetricFormValues) {
  return put<QualityMetric, QualityMetricFormValues>(API_SERVICE.qualityMetrics.detail(id), input);
}
