import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { supplierProductPrices } from "@server/db/schema/prices";
import { products } from "@server/db/schema/products";
import { suppliers } from "@server/db/schema/suppliers";

export interface PriceOverviewPoint {
  id: number;
  price: number;
  quotedAt: Date;
  note: string | null;
}

export interface PriceOverviewSupplierSeries {
  supplierId: number;
  supplierName: string;
  points: PriceOverviewPoint[];
}

export interface PriceOverviewLatestRow {
  productId: number;
  supplierId: number;
  supplierName: string;
  latestPriceId: number;
  latestPrice: number;
  quotedAt: Date;
  note: string | null;
  createdAt: Date;
  historyCount: number;
}

export interface PriceOverviewProductSeries {
  productId: number;
  productName: string;
  category: string;
  unit: string;
  supplierSeries: PriceOverviewSupplierSeries[];
  latestRows: PriceOverviewLatestRow[];
}

export interface ListPriceOverviewResult {
  products: PriceOverviewProductSeries[];
  categories: string[];
  filters: {
    search: string | null;
    category: string | null;
  };
}

const listPriceOverviewSchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
});

export async function listPriceOverview(input: unknown): Promise<ListPriceOverviewResult> {
  const params = listPriceOverviewSchema.parse(input);
  const productWhereClause = createProductWhereClause(params);
  const categoryWhereClause = createProductWhereClause({ search: params.search });

  const [productRows, categoryRows] = await Promise.all([
    db
      .selectDistinct({
        productId: products.id,
        productName: products.name,
        category: products.category,
        unit: products.unit,
      })
      .from(supplierProductPrices)
      .innerJoin(products, eq(supplierProductPrices.productId, products.id))
      .where(productWhereClause)
      .orderBy(asc(products.name), asc(products.id)),
    db
      .selectDistinct({
        category: products.category,
      })
      .from(supplierProductPrices)
      .innerJoin(products, eq(supplierProductPrices.productId, products.id))
      .where(categoryWhereClause)
      .orderBy(asc(products.category)),
  ]);

  if (productRows.length === 0) {
    return {
      products: [],
      categories: categoryRows.map((row) => row.category),
      filters: {
        search: params.search ?? null,
        category: params.category ?? null,
      },
    };
  }

  const productIds = productRows.map((row) => row.productId);

  const [historyRows, latestRows] = await Promise.all([
    db
      .select({
        id: supplierProductPrices.id,
        productId: supplierProductPrices.productId,
        supplierId: supplierProductPrices.supplierId,
        supplierName: suppliers.name,
        price: supplierProductPrices.price,
        quotedAt: supplierProductPrices.quotedAt,
        note: supplierProductPrices.note,
      })
      .from(supplierProductPrices)
      .innerJoin(suppliers, eq(supplierProductPrices.supplierId, suppliers.id))
      .where(inArray(supplierProductPrices.productId, productIds))
      .orderBy(
        asc(supplierProductPrices.productId),
        asc(suppliers.name),
        asc(supplierProductPrices.quotedAt),
        asc(supplierProductPrices.id),
      ),
    listLatestRowsForProducts(productIds),
  ]);

  const historyByProduct = new Map<number, Map<number, PriceOverviewSupplierSeries>>();

  for (const row of historyRows) {
    const productSeries = historyByProduct.get(row.productId) ?? new Map<number, PriceOverviewSupplierSeries>();
    const supplierSeries = productSeries.get(row.supplierId) ?? {
      supplierId: row.supplierId,
      supplierName: row.supplierName,
      points: [],
    };

    supplierSeries.points.push({
      id: row.id,
      price: row.price,
      quotedAt: row.quotedAt,
      note: row.note,
    });

    productSeries.set(row.supplierId, supplierSeries);
    historyByProduct.set(row.productId, productSeries);
  }

  const latestByProduct = new Map<number, PriceOverviewLatestRow[]>();
  for (const row of latestRows) {
    const current = latestByProduct.get(row.productId) ?? [];
    current.push(row);
    latestByProduct.set(row.productId, current);
  }

  return {
    products: productRows.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      unit: product.unit,
      supplierSeries: Array.from(historyByProduct.get(product.productId)?.values() ?? []).sort((left, right) =>
        left.supplierName.localeCompare(right.supplierName, "zh-CN"),
      ),
      latestRows: (latestByProduct.get(product.productId) ?? []).sort((left, right) =>
        left.supplierName.localeCompare(right.supplierName, "zh-CN"),
      ),
    })),
    categories: categoryRows.map((row) => row.category),
    filters: {
      search: params.search ?? null,
      category: params.category ?? null,
    },
  };
}

async function listLatestRowsForProducts(productIds: number[]): Promise<PriceOverviewLatestRow[]> {
  if (productIds.length === 0) {
    return [];
  }

  const rankedPricesSubquery = db
    .select({
      id: supplierProductPrices.id,
      productId: supplierProductPrices.productId,
      supplierId: supplierProductPrices.supplierId,
      supplierName: suppliers.name,
      latestPrice: supplierProductPrices.price,
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
    .where(inArray(supplierProductPrices.productId, productIds))
    .as("ranked_price_overview_rows");

  return db
    .select({
      supplierId: rankedPricesSubquery.supplierId,
      supplierName: rankedPricesSubquery.supplierName,
      productId: rankedPricesSubquery.productId,
      latestPriceId: rankedPricesSubquery.id,
      latestPrice: rankedPricesSubquery.latestPrice,
      quotedAt: rankedPricesSubquery.quotedAt,
      note: rankedPricesSubquery.note,
      createdAt: rankedPricesSubquery.createdAt,
      historyCount: sql<number>`
        (
          select count(*)
          from ${supplierProductPrices} as price_history
          where price_history.product_id = ${rankedPricesSubquery.productId}
            and price_history.supplier_id = ${rankedPricesSubquery.supplierId}
        )
      `.as("history_count"),
    })
    .from(rankedPricesSubquery)
    .where(eq(rankedPricesSubquery.rank, 1));
}

function createProductWhereClause(params: { search?: string; category?: string }) {
  const conditions = [];

  if (params.category) {
    conditions.push(eq(products.category, params.category));
  }

  if (params.search) {
    const keyword = `%${params.search}%`;
    conditions.push(or(like(products.name, keyword), like(products.category, keyword)));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}
