import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { productMetrics, products, qualityMetrics } from "@server/db/schema/products";
import { supplierQuality, suppliers } from "@server/db/schema/suppliers";

export interface QualityOverviewMetric {
  id: number;
  name: string;
  unit: string;
}

export interface QualityOverviewLatestValue {
  metricId: number;
  metricName: string;
  metricUnit: string;
  value: string;
  batchNo: string | null;
  recordedAt: Date;
  createdAt: Date;
}

export interface QualityOverviewRow {
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  category: string;
  unit: string;
  latestValues: Record<string, QualityOverviewLatestValue>;
}

export interface ListQualityOverviewParams {
  search?: string;
  supplierId?: number;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ListQualityOverviewResult {
  rows: QualityOverviewRow[];
  metrics: QualityOverviewMetric[];
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

const listQualityOverviewSchema = z.object({
  search: z.string().trim().min(1).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export async function listQualityOverview(
  input: unknown,
): Promise<ListQualityOverviewResult> {
  const params = listQualityOverviewSchema.parse(input);
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const pairsBaseQuery = db
    .select({
      supplierId: sql<number>`${supplierQuality.supplierId}`.as("supplier_id"),
      productId: sql<number>`${supplierQuality.productId}`.as("product_id"),
      supplierName: sql<string>`${suppliers.name}`.as("supplier_name"),
      productName: sql<string>`${products.name}`.as("product_name"),
      category: sql<string>`${products.category}`.as("category"),
      unit: sql<string>`${products.unit}`.as("unit"),
    })
    .from(supplierQuality)
    .innerJoin(suppliers, eq(supplierQuality.supplierId, suppliers.id))
    .innerJoin(products, eq(supplierQuality.productId, products.id));

  const whereClause = createOverviewWhereClause(params);
  const categoryWhereClause = createOverviewWhereClause({
    search: params.search,
    supplierId: params.supplierId,
  });

  const filteredPairsSubquery = pairsBaseQuery
    .where(whereClause)
    .groupBy(
      supplierQuality.supplierId,
      supplierQuality.productId,
      suppliers.name,
      products.name,
      products.category,
      products.unit,
    )
    .as("quality_overview_pairs");

  const categoriesQuery = db
    .selectDistinct({
      category: products.category,
    })
    .from(supplierQuality)
    .innerJoin(suppliers, eq(supplierQuality.supplierId, suppliers.id))
    .innerJoin(products, eq(supplierQuality.productId, products.id))
    .where(categoryWhereClause)
    .orderBy(asc(products.category));

  const [pagedPairs, countRows, categoryRows] = await Promise.all([
    db
      .select({
        supplierId: filteredPairsSubquery.supplierId,
        productId: filteredPairsSubquery.productId,
        supplierName: filteredPairsSubquery.supplierName,
        productName: filteredPairsSubquery.productName,
        category: filteredPairsSubquery.category,
        unit: filteredPairsSubquery.unit,
      })
      .from(filteredPairsSubquery)
      .orderBy(
        asc(filteredPairsSubquery.productName),
        asc(filteredPairsSubquery.supplierName),
        asc(filteredPairsSubquery.productId),
        asc(filteredPairsSubquery.supplierId),
      )
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(filteredPairsSubquery),
    categoriesQuery,
  ]);

  if (pagedPairs.length === 0) {
    return {
      rows: [],
      metrics: [],
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

  const productIds = [...new Set(pagedPairs.map((row) => row.productId))];
  const pairConditions = pagedPairs.map((row) =>
    and(
      eq(supplierQuality.supplierId, row.supplierId),
      eq(supplierQuality.productId, row.productId),
    ),
  );
  const pairsWhereClause = pairConditions.length > 0 ? or(...pairConditions) : undefined;

  const [metricRows, latestValueRows] = await Promise.all([
    db
      .select({
        productId: productMetrics.productId,
        id: qualityMetrics.id,
        name: qualityMetrics.name,
        unit: qualityMetrics.unit,
      })
      .from(productMetrics)
      .innerJoin(qualityMetrics, eq(productMetrics.metricId, qualityMetrics.id))
      .where(inArray(productMetrics.productId, productIds))
      .orderBy(asc(qualityMetrics.name), asc(qualityMetrics.id)),
    fetchLatestQualityValues(pairsWhereClause),
  ]);

  const metricsMap = new Map<number, QualityOverviewMetric>();
  for (const row of metricRows) {
    if (!metricsMap.has(row.id)) {
      metricsMap.set(row.id, {
        id: row.id,
        name: row.name,
        unit: row.unit,
      });
    }
  }

  const latestValuesByPair = new Map<string, Record<string, QualityOverviewLatestValue>>();
  for (const row of latestValueRows) {
    const key = getPairKey(row.supplierId, row.productId);
    const current = latestValuesByPair.get(key) ?? {};
    current[String(row.metricId)] = {
      metricId: row.metricId,
      metricName: row.metricName,
      metricUnit: row.metricUnit,
      value: row.value,
      batchNo: row.batchNo,
      recordedAt: row.recordedAt,
      createdAt: row.createdAt,
    };
    latestValuesByPair.set(key, current);
  }

  return {
    rows: pagedPairs.map((row) => ({
      supplierId: row.supplierId,
      supplierName: row.supplierName,
      productId: row.productId,
      productName: row.productName,
      category: row.category,
      unit: row.unit,
      latestValues: latestValuesByPair.get(getPairKey(row.supplierId, row.productId)) ?? {},
    })),
    metrics: Array.from(metricsMap.values()),
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

function createOverviewWhereClause(params: {
  search?: string;
  supplierId?: number;
  category?: string;
}) {
  const conditions = [];

  if (params.supplierId) {
    conditions.push(eq(supplierQuality.supplierId, params.supplierId));
  }

  if (params.category) {
    conditions.push(eq(products.category, params.category));
  }

  if (params.search) {
    const searchKeyword = `%${params.search}%`;

    conditions.push(
      or(
        ilike(products.name, searchKeyword),
        ilike(products.category, searchKeyword),
        ilike(suppliers.name, searchKeyword),
        sql`exists (
          select 1
          from ${supplierQuality} as sq
          inner join ${qualityMetrics}
            on ${qualityMetrics.id} = sq.metric_id
          where sq.supplier_id = ${supplierQuality.supplierId}
            and sq.product_id = ${supplierQuality.productId}
            and ${qualityMetrics.name} ilike ${searchKeyword}
        )`,
      ),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

async function fetchLatestQualityValues(
  whereClause: ReturnType<typeof or> | undefined,
) {
  if (!whereClause) {
    return [];
  }

  const rankedQualitySubquery = db
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
      rank: sql<number>`
        row_number() over (
          partition by ${supplierQuality.supplierId}, ${supplierQuality.productId}, ${supplierQuality.metricId}
          order by ${supplierQuality.recordedAt} desc, ${supplierQuality.id} desc
        )
      `.as("rank"),
    })
    .from(supplierQuality)
    .innerJoin(qualityMetrics, eq(supplierQuality.metricId, qualityMetrics.id))
    .where(whereClause)
    .as("ranked_supplier_quality");

  return db
    .select({
      supplierId: rankedQualitySubquery.supplierId,
      productId: rankedQualitySubquery.productId,
      metricId: rankedQualitySubquery.metricId,
      metricName: rankedQualitySubquery.metricName,
      metricUnit: rankedQualitySubquery.metricUnit,
      value: rankedQualitySubquery.value,
      batchNo: rankedQualitySubquery.batchNo,
      recordedAt: rankedQualitySubquery.recordedAt,
      createdAt: rankedQualitySubquery.createdAt,
    })
    .from(rankedQualitySubquery)
    .where(eq(rankedQualitySubquery.rank, 1));
}

function getPairKey(supplierId: number, productId: number) {
  return `${supplierId}:${productId}`;
}
