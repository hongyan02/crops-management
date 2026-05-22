export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const API_SERVICE = {
  products: {
    list: "/products",
    detail: (id: number) => `/products/${id}`,
    metrics: (id: number) => `/products/${id}/metrics`,
  },
  qualityMetrics: {
    list: "/quality-metrics",
    detail: (id: number) => `/quality-metrics/${id}`,
  },
  qualityOverview: {
    list: "/quality-overview",
  },
  prices: {
    list: "/prices",
    history: "/prices/history",
  },
  priceOverview: {
    list: "/price-overview",
  },
  suppliers: {
    list: "/suppliers",
    detail: (id: number) => `/suppliers/${id}`,
    products: (id: number) => `/suppliers/${id}/products`,
    quality: (supplierId: number, productId: number) =>
      `/suppliers/${supplierId}/products/${productId}/quality`,
  },
  buyers: {
    list: "/buyers",
    detail: (id: number) => `/buyers/${id}`,
    products: (id: number) => `/buyers/${id}/products`,
    requirements: (buyerId: number, productId: number) =>
      `/buyers/${buyerId}/products/${productId}/requirements`,
  },
} as const;
