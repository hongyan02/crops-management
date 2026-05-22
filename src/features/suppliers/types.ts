import type { Product } from "@/features/catalog/types";

import type { Partner, PartnerFormValues } from "../partners/types";

export type Supplier = Partner;

export type SupplierListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type SupplierProduct = Pick<Product, "id" | "name" | "category" | "unit">;

export type SupplierQualityRecord = {
  id: number;
  supplierId: number;
  productId: number;
  metricId: number;
  metricName: string;
  metricUnit: string;
  value: string;
  batchNo: string | null;
  recordedAt: string;
  createdAt?: string;
};

export type SupplierQualityEntryInput = {
  metricId: number;
  value: string;
};

export type SupplierQualityBatchInput = {
  entries: SupplierQualityEntryInput[];
  batchNo?: string;
  recordedAt?: string;
};

export type SupplierFormValues = PartnerFormValues;
