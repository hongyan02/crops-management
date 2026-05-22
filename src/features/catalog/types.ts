export type { PaginationMeta } from "@/lib/pagination";

export type Product = {
  id: number;
  name: string;
  category: string;
  unit: string;
  createdAt?: string | null;
};

export type ProductMetric = {
  id: number;
  name: string;
  unit: string;
  description: string | null;
};

export type ProductListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};
