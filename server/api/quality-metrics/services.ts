import { eq, ilike, sql } from "drizzle-orm";

import { db } from "@server/db";
import { countQualityMetricReferences } from "../catalog/repository";
import { ApiError } from "../response";
import {
  qualityMetrics,
  insertQualityMetricSchema,
  type SelectQualityMetric,
} from "@server/db/schema/products";

// ─── List ─────────────────────────────────────────────────

export interface ListMetricsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListMetricsResult {
  data: SelectQualityMetric[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listMetrics(params: ListMetricsParams = {}): Promise<ListMetricsResult> {
  const { search, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  const whereClause = search ? ilike(qualityMetrics.name, `%${search}%`) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(qualityMetrics)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(qualityMetrics)
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

export async function getMetricById(id: number): Promise<SelectQualityMetric> {
  const result = await db
    .select()
    .from(qualityMetrics)
    .where(eq(qualityMetrics.id, id))
    .limit(1);

  const metric = result[0];
  if (!metric) {
    throw ApiError.notFound(`指标 ID ${id} 不存在`);
  }

  return metric;
}

// ─── Create ───────────────────────────────────────────────

export async function createMetric(input: unknown): Promise<SelectQualityMetric> {
  const data = insertQualityMetricSchema.parse(input);

  const [metric] = await db.insert(qualityMetrics).values(data).returning();
  return metric;
}

// ─── Update ───────────────────────────────────────────────

export async function updateMetric(id: number, input: unknown): Promise<SelectQualityMetric> {
  const data = insertQualityMetricSchema.partial().parse(input);

  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest("没有需要更新的字段");
  }

  const [metric] = await db
    .update(qualityMetrics)
    .set(data)
    .where(eq(qualityMetrics.id, id))
    .returning();

  if (!metric) {
    throw ApiError.notFound(`指标 ID ${id} 不存在`);
  }

  return metric;
}

// ─── Delete ───────────────────────────────────────────────

export async function deleteMetric(id: number): Promise<void> {
  const referenceCounts = await countQualityMetricReferences(id);
  const totalReferences = Object.values(referenceCounts).reduce((sum, count) => sum + count, 0);

  if (totalReferences > 0) {
    throw ApiError.conflict("指标已被业务数据引用，暂不允许删除", referenceCounts);
  }

  const [metric] = await db
    .delete(qualityMetrics)
    .where(eq(qualityMetrics.id, id))
    .returning();

  if (!metric) {
    throw ApiError.notFound(`指标 ID ${id} 不存在`);
  }
}
