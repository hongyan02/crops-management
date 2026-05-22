export type QualityMetric = {
  id: number;
  name: string;
  unit: string;
  description: string | null;
  createdAt?: string | null;
};

export type QualityMetricListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type QualityMetricFormValues = {
  name: string;
  unit: string;
  description: string;
};
