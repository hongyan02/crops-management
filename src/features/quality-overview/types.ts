import type { PaginationMeta } from "@/lib/pagination";

export type QualityOverviewMetric = {
  id: number;
  name: string;
  unit: string;
};

export type QualityOverviewLatestValue = {
  metricId: number;
  metricName: string;
  metricUnit: string;
  value: string;
  batchNo: string | null;
  recordedAt: string;
  createdAt: string;
};

export type QualityOverviewRow = {
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  latestValues: Record<string, QualityOverviewLatestValue>;
};

export type QualityOverviewListParams = {
  search?: string;
  supplierId?: number;
  category?: string;
  page?: number;
  pageSize?: number;
};

export type QualityOverviewListData = {
  rows: QualityOverviewRow[];
  metrics: QualityOverviewMetric[];
};

export type QualityOverviewMeta = PaginationMeta & {
  filters?: {
    search: string | null;
    supplierId: number | null;
    category: string | null;
  };
  filterOptions?: {
    categories: string[];
  };
};
