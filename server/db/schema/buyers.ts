import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── 采购商 ───────────────────────────────────────────────

/** 采购商表 — 存储采购商基本信息 */
export const buyers = pgTable("buyers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBuyerSchema = createInsertSchema(buyers, {
  name: z.string().min(1, "采购商名称不能为空").max(100),
  contact: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
}).omit({ id: true, createdAt: true });

export const selectBuyerSchema = createSelectSchema(buyers);

export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type SelectBuyer = z.infer<typeof selectBuyerSchema>;

// ─── 采购商-产品关联 ───────────────────────────────────────

/** 采购商产品关联表 — 记录采购商需要采购的产品，无外键，应用层校验 */
export const buyerProducts = pgTable("buyer_products", {
  buyerId: integer("buyer_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: uniqueIndex("pk_buyer_products").on(t.buyerId, t.productId),
  productIdx: index("idx_bp_product").on(t.productId),
}));

export const insertBuyerProductSchema = createInsertSchema(buyerProducts, {
  buyerId: z.number().int().positive(),
  productId: z.number().int().positive(),
}).omit({ createdAt: true });

export type InsertBuyerProduct = z.infer<typeof insertBuyerProductSchema>;

// ─── 采购商需求 ───────────────────────────────────────────

export const buyerQualityLevels = ["standard", "concession", "rejection"] as const;
export const buyerQualityLevelSchema = z.enum(buyerQualityLevels);
export type BuyerQualityLevel = z.infer<typeof buyerQualityLevelSchema>;

/** 采购商需求表 — 记录采购商对产品质量指标的要求范围 */
export const buyerRequirements = pgTable("buyer_requirements", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  productId: integer("product_id").notNull(),
  metricId: integer("metric_id").notNull(),
  qualityLevel: text("quality_level", { enum: buyerQualityLevels })
    .notNull()
    .default("standard"),
  minValue: text("min_value"),
  maxValue: text("max_value"),
  qualityStandard: text("quality_standard"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  buyerIdx: index("idx_br_buyer").on(t.buyerId),
  productIdx: index("idx_br_product").on(t.productId),
  metricLevelIdx: index("idx_br_metric_level").on(t.metricId, t.qualityLevel),
}));

export const insertBuyerRequirementSchema = createInsertSchema(buyerRequirements, {
  buyerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  metricId: z.number().int().positive(),
  qualityLevel: buyerQualityLevelSchema.default("standard"),
  qualityStandard: z.string().optional(),
  notes: z.string().max(200).optional(),
}).omit({ id: true, createdAt: true, minValue: true, maxValue: true });

export type InsertBuyerRequirement = z.infer<typeof insertBuyerRequirementSchema>;
export type SelectBuyerRequirement = z.infer<typeof selectBuyerRequirementSchema>;

export const selectBuyerRequirementSchema = createSelectSchema(buyerRequirements);
