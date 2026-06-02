import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { ApiError } from "../response";
import { ensureProductMetricBound, ensureProductsExist } from "../catalog/repository";
import { products, qualityMetrics } from "@server/db/schema/products";
import {
  insertSupplierSchema,
  supplierProducts,
  supplierQuality,
  suppliers,
  type SelectSupplier,
} from "@server/db/schema/suppliers";

export interface SupplierProductDetail {
  id: number;
  name: string;
  category: string;
  unit: string;
}

export interface SupplierQualityDetail {
  id: number;
  supplierId: number;
  productId: number;
  metricId: number;
  metricName: string;
  metricUnit: string;
  value: string;
  batchNo: string | null;
  recordedAt: Date;
  createdAt: Date;
}

export interface ListSuppliersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SupplierListItem extends SelectSupplier {
  productCount: number;
  qualityRecordCount: number;
}

export interface ListSuppliersResult {
  data: SupplierListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listSuppliers(
  params: ListSuppliersParams = {},
): Promise<ListSuppliersResult> {
  const { search, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;
  const whereClause = search ? ilike(suppliers.name, `%${search}%`) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        contact: suppliers.contact,
        phone: suppliers.phone,
        address: suppliers.address,
        createdAt: suppliers.createdAt,
        productCount: sql<number>`count(distinct ${supplierProducts.productId})::int`,
        qualityRecordCount: sql<number>`count(distinct ${supplierQuality.id})::int`,
      })
      .from(suppliers)
      .leftJoin(supplierProducts, eq(suppliers.id, supplierProducts.supplierId))
      .leftJoin(supplierQuality, eq(suppliers.id, supplierQuality.supplierId))
      .where(whereClause)
      .groupBy(suppliers.id)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(whereClause),
  ]);

  return {
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getSupplierById(id: number): Promise<SelectSupplier> {
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  const supplier = result[0];

  if (!supplier) {
    throw ApiError.notFound(`供应商 ID ${id} 不存在`);
  }

  return supplier;
}

export async function createSupplier(input: unknown): Promise<SelectSupplier> {
  const data = insertSupplierSchema.parse(input);
  const [supplier] = await db.insert(suppliers).values(data).returning();

  return supplier;
}

export async function updateSupplier(id: number, input: unknown): Promise<SelectSupplier> {
  const data = insertSupplierSchema.partial().parse(input);

  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest("没有需要更新的字段");
  }

  const [supplier] = await db
    .update(suppliers)
    .set(data)
    .where(eq(suppliers.id, id))
    .returning();

  if (!supplier) {
    throw ApiError.notFound(`供应商 ID ${id} 不存在`);
  }

  return supplier;
}

export async function listSupplierProducts(supplierId: number): Promise<SupplierProductDetail[]> {
  await getSupplierById(supplierId);

  return db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      unit: products.unit,
    })
    .from(supplierProducts)
    .innerJoin(products, eq(supplierProducts.productId, products.id))
    .where(eq(supplierProducts.supplierId, supplierId));
}

const replaceSupplierProductsSchema = z.object({
  productIds: z.array(z.number().int().positive()).default([]),
});

export async function replaceSupplierProducts(
  supplierId: number,
  input: unknown,
): Promise<SupplierProductDetail[]> {
  const { productIds } = replaceSupplierProductsSchema.parse(input);
  const uniqueProductIds = [...new Set(productIds)];

  await getSupplierById(supplierId);
  await ensureProductsExist(uniqueProductIds);

  await db.transaction(async (tx) => {
    await tx.delete(supplierProducts).where(eq(supplierProducts.supplierId, supplierId));

    if (uniqueProductIds.length > 0) {
      await tx.insert(supplierProducts).values(
        uniqueProductIds.map((productId) => ({
          supplierId,
          productId,
        })),
      );
    }
  });

  return listSupplierProducts(supplierId);
}

export async function listSupplierProductQuality(
  supplierId: number,
  productId: number,
): Promise<SupplierQualityDetail[]> {
  await ensureSupplierProduct(supplierId, productId);

  return db
    .select({
      id: supplierQuality.id,
      supplierId: supplierQuality.supplierId,
      productId: supplierQuality.productId,
      metricId: supplierQuality.metricId,
      metricName: qualityMetrics.name,
      metricUnit: qualityMetrics.unit,
      value: supplierQuality.value,
      batchNo: supplierQuality.batchNo,
      recordedAt: supplierQuality.recordedAt,
      createdAt: supplierQuality.createdAt,
    })
    .from(supplierQuality)
    .innerJoin(qualityMetrics, eq(supplierQuality.metricId, qualityMetrics.id))
    .where(and(eq(supplierQuality.supplierId, supplierId), eq(supplierQuality.productId, productId)))
    .orderBy(desc(supplierQuality.recordedAt), desc(supplierQuality.id));
}

const supplierQualityEntrySchema = z.object({
  metricId: z.number().int().positive(),
  value: z.string().min(1, "质量结果不能为空").max(100),
});

const createSupplierQualitySchema = z.object({
  entries: z.array(supplierQualityEntrySchema).min(1, "请至少填写一个质检指标的结果"),
  batchNo: z.string().max(50).optional(),
  recordedAt: z.string().datetime().optional(),
});

export async function createSupplierProductQuality(
  supplierId: number,
  productId: number,
  input: unknown,
): Promise<SupplierQualityDetail[]> {
  const data = createSupplierQualitySchema.parse(input);
  const metricEntries = Array.from(
    new Map(data.entries.map((entry) => [entry.metricId, entry])).values(),
  );
  const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();

  await ensureSupplierProduct(supplierId, productId);
  await Promise.all(
    metricEntries.map((entry) => ensureProductMetricBound(productId, entry.metricId)),
  );

  const records = await db
    .insert(supplierQuality)
    .values(
      metricEntries.map((entry) => ({
        supplierId,
        productId,
        metricId: entry.metricId,
        value: entry.value,
        batchNo: data.batchNo,
        recordedAt,
      })),
    )
    .returning({ id: supplierQuality.id });

  return db
    .select({
      id: supplierQuality.id,
      supplierId: supplierQuality.supplierId,
      productId: supplierQuality.productId,
      metricId: supplierQuality.metricId,
      metricName: qualityMetrics.name,
      metricUnit: qualityMetrics.unit,
      value: supplierQuality.value,
      batchNo: supplierQuality.batchNo,
      recordedAt: supplierQuality.recordedAt,
      createdAt: supplierQuality.createdAt,
    })
    .from(supplierQuality)
    .innerJoin(qualityMetrics, eq(supplierQuality.metricId, qualityMetrics.id))
    .where(inArray(supplierQuality.id, records.map((record) => record.id)))
    .orderBy(desc(supplierQuality.recordedAt), desc(supplierQuality.id));
}

async function ensureSupplierProduct(supplierId: number, productId: number) {
  await getSupplierById(supplierId);
  await ensureProductsExist([productId]);

  const existing = await db
    .select({ productId: supplierProducts.productId })
    .from(supplierProducts)
    .where(and(eq(supplierProducts.supplierId, supplierId), eq(supplierProducts.productId, productId)))
    .limit(1);

  if (!existing[0]) {
    throw ApiError.badRequest("该供应商尚未绑定此产品");
  }
}
