import type { Product } from "@/features/catalog/types";

import type { Partner, PartnerFormValues } from "../partners/types";

export type Buyer = Partner;

export type BuyerListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type BuyerProduct = Pick<Product, "id" | "name" | "category" | "unit">;

export type QualityLevel = "standard" | "concession" | "rejection";

export type BuyerRequirement = {
  id: number;
  buyerId: number;
  productId: number;
  metricId: number;
  metricName: string;
  metricUnit: string;
  qualityLevel: QualityLevel;
  minValue: string | null;
  maxValue: string | null;
  notes: string | null;
  createdAt?: string;
};

export type BuyerRequirementInput = {
  metricId: number;
  qualityLevel: QualityLevel;
  minValue?: string;
  maxValue?: string;
  notes?: string;
};

export type BuyerFormValues = PartnerFormValues;
