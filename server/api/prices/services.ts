import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { supplierProductPrices } from "@server/db/schema/prices";
import { products } from "@server/db/schema/products";
import { supplierProducts, suppliers } from "@server/db/schema/suppliers";

import { ensureProductsExist } from "../catalog/repository";
import { ApiError } from "../response";

export interface LatestSupplierProductPriceRow {
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  latestPriceId: number;
  latestPrice: number;
  quotedAt: Date;
  note: string | null;
  createdAt: Date;
  historyCount: number;
}

export interface ListPricesParams {
  search?: string;
  supplierId?: number;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ListLatestPricesResult {
  data: LatestSupplierProductPriceRow[];
  categories: string[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    search: string | null;
    supplierId: number | null;
    category: string | null;
  };
}

export interface PriceHistoryRecord {
  id: number;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  price: number;
  quotedAt: Date;
  note: string | null;
  createdAt: Date;
}

const listPricesSchema = z.object({
  search: z.string().trim().min(1).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const createPriceSchema = z.object({
  supplierId: z.number().int().positive(),
  productId: z.number().int().positive(),
  price: z.number().positive("价格必须大于 0"),
  quotedAt: z.string().datetime().optional(),
  note: z
    .string()
    .trim()
    .max(500, "备注不能超过 500 个字符")
    .optional()
    .transform((value) => value || undefined),
});

const listPriceHistorySchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive(),
});

export async function listLatestPrices(input: unknown): Promise<ListLatestPricesResult> {
  const params = listPricesSchema.parse(input);
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const latestPricesSubquery = buildLatestPricesSubquery();
  const whereClause = createLatestPriceWhereClause(latestPricesSubquery, params);
  const categoryWhereClause = createLatestPriceWhereClause(latestPricesSubquery, {
    search: params.search,
    supplierId: params.supplierId,
  });

  const [rows, countRows, categoryRows] = await Promise.all([
    db
      .select({
        supplierId: latestPricesSubquery.supplierId,
        supplierName: latestPricesSubquery.supplierName,
        productId: latestPricesSubquery.productId,
        productName: latestPricesSubquery.productName,
        category: latestPricesSubquery.category,
        unit: latestPricesSubquery.unit,
        latestPriceId: latestPricesSubquery.id,
        latestPrice: latestPricesSubquery.price,
        quotedAt: latestPricesSubquery.quotedAt,
        note: latestPricesSubquery.note,
        createdAt: latestPricesSubquery.createdAt,
        historyCount: sql<number>`
          (
            select count(*)
            from ${supplierProductPrices} as price_history
            where price_history.supplier_id = ${latestPricesSubquery.supplierId}
              and price_history.product_id = ${latestPricesSubquery.productId}
          )
        `.as("history_count"),
      })
      .from(latestPricesSubquery)
      .where(whereClause)
      .orderBy(
        asc(latestPricesSubquery.productName),
        asc(latestPricesSubquery.supplierName),
        asc(latestPricesSubquery.productId),
        asc(latestPricesSubquery.supplierId),
      )
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(latestPricesSubquery).where(whereClause),
    db
      .selectDistinct({ category: latestPricesSubquery.category })
      .from(latestPricesSubquery)
      .where(categoryWhereClause)
      .orderBy(asc(latestPricesSubquery.category)),
  ]);

  return {
    data: rows,
    categories: categoryRows.map((row) => row.category),
    total: countRows[0]?.count ?? 0,
    page,
    pageSize,
    filters: {
      search: params.search ?? null,
      supplierId: params.supplierId ?? null,
      category: params.category ?? null,
    },
  };
}

export async function createPrice(input: unknown): Promise<PriceHistoryRecord> {
  const data = createPriceSchema.parse(input);

  await ensureSupplierProduct(data.supplierId, data.productId);

  const [record] = await db
    .insert(supplierProductPrices)
    .values({
      supplierId: data.supplierId,
      productId: data.productId,
      price: data.price,
      quotedAt: data.quotedAt ? new Date(data.quotedAt) : new Date(),
      note: data.note,
    })
    .returning();

  const detail = await getPriceHistoryRecordById(record.id);

  if (!detail) {
    throw ApiError.internal("价格记录创建成功但读取失败");
  }

  return detail;
}

export async function listPriceHistory(input: unknown): Promise<PriceHistoryRecord[]> {
  const params = listPriceHistorySchema.parse(input);

  await ensureSupplierProduct(params.supplierId, params.productId);

  return db
    .select({
      id: supplierProductPrices.id,
      supplierId: supplierProductPrices.supplierId,
      supplierName: suppliers.name,
      productId: supplierProductPrices.productId,
      productName: products.name,
      category: products.category,
      unit: products.unit,
      price: supplierProductPrices.price,
      quotedAt: supplierProductPrices.quotedAt,
      note: supplierProductPrices.note,
      createdAt: supplierProductPrices.createdAt,
    })
    .from(supplierProductPrices)
    .innerJoin(suppliers, eq(supplierProductPrices.supplierId, suppliers.id))
    .innerJoin(products, eq(supplierProductPrices.productId, products.id))
    .where(
      and(
        eq(supplierProductPrices.supplierId, params.supplierId),
        eq(supplierProductPrices.productId, params.productId),
      ),
    )
    .orderBy(desc(supplierProductPrices.quotedAt), desc(supplierProductPrices.id));
}

function buildLatestPricesSubquery() {
  const rankedPricesSubquery = db
    .select({
      id: supplierProductPrices.id,
      supplierId: supplierProductPrices.supplierId,
      supplierName: sql<string>`${suppliers.name}`.as("supplier_name"),
      productId: supplierProductPrices.productId,
      productName: sql<string>`${products.name}`.as("product_name"),
      category: products.category,
      unit: products.unit,
      price: supplierProductPrices.price,
      quotedAt: supplierProductPrices.quotedAt,
      note: supplierProductPrices.note,
      createdAt: supplierProductPrices.createdAt,
      rank: sql<number>`
        row_number() over (
          partition by ${supplierProductPrices.supplierId}, ${supplierProductPrices.productId}
          order by ${supplierProductPrices.quotedAt} desc, ${supplierProductPrices.id} desc
        )
      `.as("rank"),
    })
    .from(supplierProductPrices)
    .innerJoin(suppliers, eq(supplierProductPrices.supplierId, suppliers.id))
    .innerJoin(products, eq(supplierProductPrices.productId, products.id))
    .as("ranked_supplier_product_prices");

  return db
    .select({
      id: rankedPricesSubquery.id,
      supplierId: rankedPricesSubquery.supplierId,
      supplierName: rankedPricesSubquery.supplierName,
      productId: rankedPricesSubquery.productId,
      productName: rankedPricesSubquery.productName,
      category: rankedPricesSubquery.category,
      unit: rankedPricesSubquery.unit,
      price: rankedPricesSubquery.price,
      quotedAt: rankedPricesSubquery.quotedAt,
      note: rankedPricesSubquery.note,
      createdAt: rankedPricesSubquery.createdAt,
    })
    .from(rankedPricesSubquery)
    .where(eq(rankedPricesSubquery.rank, 1))
    .as("latest_supplier_product_prices");
}

function createLatestPriceWhereClause(
  latestPricesSubquery: ReturnType<typeof buildLatestPricesSubquery>,
  params: {
    search?: string;
    supplierId?: number;
    category?: string;
  },
) {
  const conditions = [];

  if (params.supplierId) {
    conditions.push(eq(latestPricesSubquery.supplierId, params.supplierId));
  }

  if (params.category) {
    conditions.push(eq(latestPricesSubquery.category, params.category));
  }

  if (params.search) {
    const keyword = `%${params.search}%`;
    conditions.push(
      or(
        like(latestPricesSubquery.productName, keyword),
        like(latestPricesSubquery.category, keyword),
        like(latestPricesSubquery.supplierName, keyword),
      ),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

async function ensureSupplierProduct(supplierId: number, productId: number) {
  await ensureProductsExist([productId]);

  const [existingSupplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);

  if (!existingSupplier) {
    throw ApiError.notFound(`供应商 ID ${supplierId} 不存在`);
  }

  const [relation] = await db
    .select({
      productId: supplierProducts.productId,
    })
    .from(supplierProducts)
    .where(and(eq(supplierProducts.supplierId, supplierId), eq(supplierProducts.productId, productId)))
    .limit(1);

  if (!relation) {
    throw ApiError.badRequest("该供应商尚未关联此产品");
  }
}

async function getPriceHistoryRecordById(id: number) {
  const records = await db
    .select({
      id: supplierProductPrices.id,
      supplierId: supplierProductPrices.supplierId,
      supplierName: suppliers.name,
      productId: supplierProductPrices.productId,
      productName: products.name,
      category: products.category,
      unit: products.unit,
      price: supplierProductPrices.price,
      quotedAt: supplierProductPrices.quotedAt,
      note: supplierProductPrices.note,
      createdAt: supplierProductPrices.createdAt,
    })
    .from(supplierProductPrices)
    .innerJoin(suppliers, eq(supplierProductPrices.supplierId, suppliers.id))
    .innerJoin(products, eq(supplierProductPrices.productId, products.id))
    .where(eq(supplierProductPrices.id, id))
    .limit(1);

  return records[0];
}
