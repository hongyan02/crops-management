import type { PaginationMeta } from "@/lib/pagination";

export type PriceRecord = {
  id: number;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  price: number;
  quotedAt: string;
  note: string | null;
  createdAt: string;
};

export type PriceHistoryRecord = PriceRecord;

export type LatestSupplierProductPriceRow = {
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  latestPriceId: number;
  latestPrice: number;
  quotedAt: string;
  note: string | null;
  createdAt: string;
  historyCount: number;
};

export type PriceListParams = {
  search?: string;
  supplierId?: number;
  category?: string;
  page?: number;
  pageSize?: number;
};

export type CreatePriceInput = {
  supplierId: number;
  productId: number;
  price: number;
  quotedAt?: string;
  note?: string;
};

export type PriceFormValues = {
  supplierId: string;
  productId: string;
  price: string;
  quotedAt: string;
  note: string;
};

export type PriceListMeta = PaginationMeta & {
  filters?: {
    search: string | null;
    supplierId: number | null;
    category: string | null;
  };
  filterOptions?: {
    categories: string[];
  };
};
