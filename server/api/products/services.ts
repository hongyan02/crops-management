import { eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { countProductReferences } from "../catalog/repository";
import { ApiError } from "../response";
import {
  insertProductSchema,
  productMetrics,
  products,
  qualityMetrics,
  type SelectProduct,
} from "@server/db/schema/products";

// ─── List ─────────────────────────────────────────────────

export interface ListProductsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListProductsResult {
  data: SelectProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResult> {
  const { search, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? or(like(products.name, `%${search}%`), like(products.category, `%${search}%`))
    : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause),
  ]);

  return {
    data,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

// ─── Get by ID ────────────────────────────────────────────

export async function getProductById(id: number): Promise<SelectProduct> {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  const product = result[0];
  if (!product) {
    throw ApiError.notFound(`产品 ID ${id} 不存在`);
  }

  return product;
}

export interface ProductMetricDetail {
  id: number;
  name: string;
  unit: string;
  description: string | null;
}

export async function listProductMetrics(productId: number): Promise<ProductMetricDetail[]> {
  await getProductById(productId);

  return db
    .select({
      id: qualityMetrics.id,
      name: qualityMetrics.name,
      unit: qualityMetrics.unit,
      description: qualityMetrics.description,
    })
    .from(productMetrics)
    .innerJoin(qualityMetrics, eq(productMetrics.metricId, qualityMetrics.id))
    .where(eq(productMetrics.productId, productId));
}

// ─── Create ───────────────────────────────────────────────

export async function createProduct(input: unknown): Promise<SelectProduct> {
  const data = insertProductSchema.parse(input);

  const [product] = await db.insert(products).values(data).returning();
  return product;
}

// ─── Update ───────────────────────────────────────────────

export async function updateProduct(id: number, input: unknown): Promise<SelectProduct> {
  const data = insertProductSchema.partial().parse(input);

  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest("没有需要更新的字段");
  }

  const [product] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    throw ApiError.notFound(`产品 ID ${id} 不存在`);
  }

  return product;
}

const updateProductMetricsSchema = z.object({
  metricIds: z.array(z.number().int().positive()).default([]),
});

export async function replaceProductMetrics(
  productId: number,
  input: unknown,
): Promise<ProductMetricDetail[]> {
  const { metricIds } = updateProductMetricsSchema.parse(input);
  const uniqueMetricIds = [...new Set(metricIds)];

  await getProductById(productId);

  if (uniqueMetricIds.length > 0) {
    const existingMetrics = await db
      .select({ id: qualityMetrics.id })
      .from(qualityMetrics)
      .where(inArray(qualityMetrics.id, uniqueMetricIds));

    if (existingMetrics.length !== uniqueMetricIds.length) {
      throw ApiError.badRequest("存在无效的指标 ID");
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(productMetrics).where(eq(productMetrics.productId, productId));

    if (uniqueMetricIds.length > 0) {
      await tx.insert(productMetrics).values(
        uniqueMetricIds.map((metricId) => ({
          productId,
          metricId,
        })),
      );
    }
  });

  return listProductMetrics(productId);
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteProduct(id: number): Promise<void> {
  const referenceCounts = await countProductReferences(id);
  const totalReferences = Object.values(referenceCounts).reduce((sum, count) => sum + count, 0);

  if (totalReferences > 0) {
    throw ApiError.conflict("产品已被业务数据引用，暂不允许删除", referenceCounts);
  }

  const [product] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    throw ApiError.notFound(`产品 ID ${id} 不存在`);
  }
}
