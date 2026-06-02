import { and, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@server/db";
import { ApiError } from "../response";
import { ensureProductMetricsBound, ensureProductsExist } from "../catalog/repository";
import { products, qualityMetrics } from "@server/db/schema/products";
import {
  buyerProducts,
  buyerQualityLevelSchema,
  buyerRequirements,
  buyers,
  insertBuyerSchema,
  type BuyerQualityLevel,
  type SelectBuyer,
} from "@server/db/schema/buyers";

export interface BuyerProductDetail {
  id: number;
  name: string;
  category: string;
  unit: string;
}

export interface BuyerRequirementDetail {
  id: number;
  buyerId: number;
  productId: number;
  metricId: number;
  metricName: string;
  metricUnit: string;
  qualityLevel: BuyerQualityLevel;
  qualityStandard: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface BuyerListItem extends SelectBuyer {
  productCount: number;
  requirementCount: number;
}

export interface ListBuyersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListBuyersResult {
  data: BuyerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listBuyers(params: ListBuyersParams = {}): Promise<ListBuyersResult> {
  const { search, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;
  const whereClause = search ? ilike(buyers.name, `%${search}%`) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: buyers.id,
        name: buyers.name,
        contact: buyers.contact,
        phone: buyers.phone,
        address: buyers.address,
        createdAt: buyers.createdAt,
        productCount: sql<number>`count(distinct ${buyerProducts.productId})::int`,
        requirementCount: sql<number>`count(distinct ${buyerRequirements.id})::int`,
      })
      .from(buyers)
      .leftJoin(buyerProducts, eq(buyers.id, buyerProducts.buyerId))
      .leftJoin(buyerRequirements, eq(buyers.id, buyerRequirements.buyerId))
      .where(whereClause)
      .groupBy(buyers.id)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(buyers)
      .where(whereClause),
  ]);

  return {
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getBuyerById(id: number): Promise<SelectBuyer> {
  const result = await db.select().from(buyers).where(eq(buyers.id, id)).limit(1);
  const buyer = result[0];

  if (!buyer) {
    throw ApiError.notFound(`采购商 ID ${id} 不存在`);
  }

  return buyer;
}

export async function createBuyer(input: unknown): Promise<SelectBuyer> {
  const data = insertBuyerSchema.parse(input);
  const [buyer] = await db.insert(buyers).values(data).returning();

  return buyer;
}

export async function updateBuyer(id: number, input: unknown): Promise<SelectBuyer> {
  const data = insertBuyerSchema.partial().parse(input);

  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest("没有需要更新的字段");
  }

  const [buyer] = await db.update(buyers).set(data).where(eq(buyers.id, id)).returning();

  if (!buyer) {
    throw ApiError.notFound(`采购商 ID ${id} 不存在`);
  }

  return buyer;
}

export async function listBuyerProducts(buyerId: number): Promise<BuyerProductDetail[]> {
  await getBuyerById(buyerId);

  return db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      unit: products.unit,
    })
    .from(buyerProducts)
    .innerJoin(products, eq(buyerProducts.productId, products.id))
    .where(eq(buyerProducts.buyerId, buyerId));
}

const replaceBuyerProductsSchema = z.object({
  productIds: z.array(z.number().int().positive()).default([]),
});

export async function replaceBuyerProducts(
  buyerId: number,
  input: unknown,
): Promise<BuyerProductDetail[]> {
  const { productIds } = replaceBuyerProductsSchema.parse(input);
  const uniqueProductIds = [...new Set(productIds)];

  await getBuyerById(buyerId);
  await ensureProductsExist(uniqueProductIds);

  await db.transaction(async (tx) => {
    await tx.delete(buyerProducts).where(eq(buyerProducts.buyerId, buyerId));

    if (uniqueProductIds.length > 0) {
      await tx.insert(buyerProducts).values(
        uniqueProductIds.map((productId) => ({
          buyerId,
          productId,
        })),
      );
    }
  });

  return listBuyerProducts(buyerId);
}

export async function listBuyerProductRequirements(
  buyerId: number,
  productId: number,
): Promise<BuyerRequirementDetail[]> {
  await ensureBuyerProduct(buyerId, productId);

  return db
    .select({
      id: buyerRequirements.id,
      buyerId: buyerRequirements.buyerId,
      productId: buyerRequirements.productId,
      metricId: buyerRequirements.metricId,
      metricName: qualityMetrics.name,
      metricUnit: qualityMetrics.unit,
      qualityLevel: buyerRequirements.qualityLevel,
      qualityStandard: buyerRequirements.qualityStandard,
      notes: buyerRequirements.notes,
      createdAt: buyerRequirements.createdAt,
    })
    .from(buyerRequirements)
    .innerJoin(qualityMetrics, eq(buyerRequirements.metricId, qualityMetrics.id))
    .where(and(eq(buyerRequirements.buyerId, buyerId), eq(buyerRequirements.productId, productId)));
}

const requirementInputSchema = z.object({
  metricId: z.number().int().positive(),
  qualityLevel: buyerQualityLevelSchema,
  qualityStandard: z.string().max(100).optional(),
  notes: z.string().max(200).optional(),
});

const replaceRequirementsSchema = z.object({
  requirements: z.array(requirementInputSchema).default([]),
});

export async function replaceBuyerProductRequirements(
  buyerId: number,
  productId: number,
  input: unknown,
): Promise<BuyerRequirementDetail[]> {
  const { requirements } = replaceRequirementsSchema.parse(input);
  const normalized = dedupeRequirements(requirements);

  await ensureBuyerProduct(buyerId, productId);
  await ensureProductMetricsBound(
    productId,
    normalized.map((requirement) => requirement.metricId),
  );

  await db.transaction(async (tx) => {
    await tx
      .delete(buyerRequirements)
      .where(and(eq(buyerRequirements.buyerId, buyerId), eq(buyerRequirements.productId, productId)));

    if (normalized.length > 0) {
      await tx.insert(buyerRequirements).values(
        normalized.map((requirement) => ({
          buyerId,
          productId,
          metricId: requirement.metricId,
          qualityLevel: requirement.qualityLevel,
          qualityStandard: emptyToNull(requirement.qualityStandard),
          notes: emptyToNull(requirement.notes),
        })),
      );
    }
  });

  return listBuyerProductRequirements(buyerId, productId);
}

async function ensureBuyerProduct(buyerId: number, productId: number) {
  await getBuyerById(buyerId);
  await ensureProductsExist([productId]);

  const existing = await db
    .select({ productId: buyerProducts.productId })
    .from(buyerProducts)
    .where(and(eq(buyerProducts.buyerId, buyerId), eq(buyerProducts.productId, productId)))
    .limit(1);

  if (!existing[0]) {
    throw ApiError.badRequest("该采购商尚未绑定此产品");
  }
}

function dedupeRequirements(requirements: z.infer<typeof requirementInputSchema>[]) {
  const byMetricAndLevel = new Map<string, z.infer<typeof requirementInputSchema>>();

  for (const requirement of requirements) {
    byMetricAndLevel.set(`${requirement.metricId}:${requirement.qualityLevel}`, requirement);
  }

  return [...byMetricAndLevel.values()];
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
