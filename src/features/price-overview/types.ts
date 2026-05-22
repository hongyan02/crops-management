export type PriceOverviewPoint = {
  id: number;
  price: number;
  quotedAt: string;
  note: string | null;
};

export type PriceOverviewSupplierSeries = {
  supplierId: number;
  supplierName: string;
  points: PriceOverviewPoint[];
};

export type PriceOverviewLatestRow = {
  productId: number;
  supplierId: number;
  supplierName: string;
  latestPriceId: number;
  latestPrice: number;
  quotedAt: string;
  note: string | null;
  createdAt: string;
  historyCount: number;
};

export type PriceOverviewProductSeries = {
  productId: number;
  productName: string;
  category: string;
  unit: string;
  supplierSeries: PriceOverviewSupplierSeries[];
  latestRows: PriceOverviewLatestRow[];
};

export type PriceOverviewListParams = {
  search?: string;
  category?: string;
};

export type PriceOverviewListData = {
  products: PriceOverviewProductSeries[];
};

export type PriceOverviewMeta = {
  filters?: {
    search: string | null;
    category: string | null;
  };
  filterOptions?: {
    categories: string[];
  };
};
