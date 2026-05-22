// Auth
export * from "./auth";

// Business
export * from "./products";
export * from "./suppliers";
export * from "./buyers";
export * from "./prices";

// Combined schema for Drizzle ORM initialization
import { authSchema } from "./auth";
import { products, qualityMetrics, productMetrics } from "./products";
import { suppliers, supplierProducts, supplierQuality } from "./suppliers";
import { buyers, buyerProducts, buyerRequirements } from "./buyers";
import { supplierProductPrices } from "./prices";

export const schema = {
  ...authSchema,
  products,
  qualityMetrics,
  productMetrics,
  suppliers,
  supplierProducts,
  supplierQuality,
  supplierProductPrices,
  buyers,
  buyerProducts,
  buyerRequirements,
};
