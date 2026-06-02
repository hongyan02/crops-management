import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@server/db";
import { buyerProducts, buyerRequirements } from "@server/db/schema/buyers";
import { supplierProductPrices } from "@server/db/schema/prices";
import { productMetrics, products } from "@server/db/schema/products";
import { supplierProducts, supplierQuality } from "@server/db/schema/suppliers";
import { ApiError } from "../response";

export async function ensureProductsExist(productIds: number[]) {
  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length === 0) {
    return;
  }

  const existingProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, uniqueProductIds));

  if (existingProducts.length !== uniqueProductIds.length) {
    throw ApiError.badRequest("存在无效的产品 ID");
  }
}

export async function ensureProductMetricsBound(productId: number, metricIds: number[]) {
  const uniqueMetricIds = [...new Set(metricIds)];

  if (uniqueMetricIds.length === 0) {
    return;
  }

  const existingMetrics = await db
    .select({ metricId: productMetrics.metricId })
    .from(productMetrics)
    .where(and(eq(productMetrics.productId, productId), inArray(productMetrics.metricId, uniqueMetricIds)));

  if (existingMetrics.length !== uniqueMetricIds.length) {
    throw ApiError.badRequest("存在未绑定到该产品的质量指标");
  }
}

export async function ensureProductMetricBound(productId: number, metricId: number) {
  const existing = await db
    .select({ metricId: productMetrics.metricId })
    .from(productMetrics)
    .where(and(eq(productMetrics.productId, productId), eq(productMetrics.metricId, metricId)))
    .limit(1);

  if (!existing[0]) {
    throw ApiError.badRequest("该产品尚未绑定此质量指标");
  }
}

export async function countProductReferences(productId: number) {
  const [
    productMetricCount,
    buyerProductCount,
    buyerRequirementCount,
    supplierProductCount,
    supplierQualityCount,
    supplierPriceCount,
  ] = await Promise.all([
    countProductMetricRows(productId),
    countBuyerProductRows(productId),
    countBuyerRequirementRows(productId),
    countSupplierProductRows(productId),
    countSupplierQualityRows(productId),
    countSupplierPriceRows(productId),
  ]);

  return {
    productMetricCount,
    buyerProductCount,
    buyerRequirementCount,
    supplierProductCount,
    supplierQualityCount,
    supplierPriceCount,
  };
}

export async function countQualityMetricReferences(metricId: number) {
  const [productMetricCount, buyerRequirementCount, supplierQualityCount] = await Promise.all([
    countMetricBindingRows(metricId),
    countBuyerRequirementMetricRows(metricId),
    countSupplierQualityMetricRows(metricId),
  ]);

  return {
    productMetricCount,
    buyerRequirementCount,
    supplierQualityCount,
  };
}

async function countProductMetricRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productMetrics)
    .where(eq(productMetrics.productId, productId));

  return result[0]?.count ?? 0;
}

async function countBuyerProductRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(buyerProducts)
    .where(eq(buyerProducts.productId, productId));

  return result[0]?.count ?? 0;
}

async function countBuyerRequirementRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(buyerRequirements)
    .where(eq(buyerRequirements.productId, productId));

  return result[0]?.count ?? 0;
}

async function countSupplierProductRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supplierProducts)
    .where(eq(supplierProducts.productId, productId));

  return result[0]?.count ?? 0;
}

async function countSupplierQualityRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supplierQuality)
    .where(eq(supplierQuality.productId, productId));

  return result[0]?.count ?? 0;
}

async function countSupplierPriceRows(productId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supplierProductPrices)
    .where(eq(supplierProductPrices.productId, productId));

  return result[0]?.count ?? 0;
}

async function countMetricBindingRows(metricId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productMetrics)
    .where(eq(productMetrics.metricId, metricId));

  return result[0]?.count ?? 0;
}

async function countBuyerRequirementMetricRows(metricId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(buyerRequirements)
    .where(eq(buyerRequirements.metricId, metricId));

  return result[0]?.count ?? 0;
}

async function countSupplierQualityMetricRows(metricId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supplierQuality)
    .where(eq(supplierQuality.metricId, metricId));

  return result[0]?.count ?? 0;
}
