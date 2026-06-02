import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── 产品目录 ─────────────────────────────────────────────

/** 产品表 — 存储产品名称、分类、计量单位 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    unit: text("unit").notNull().default("吨"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("idx_products_category").on(t.category),
  }),
);

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(1, "产品名称不能为空").max(100),
  category: z.string().min(1, "分类不能为空").max(50),
  unit: z.string().max(10).default("吨"),
}).omit({ id: true, createdAt: true });

export const selectProductSchema = createSelectSchema(products);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = z.infer<typeof selectProductSchema>;

// ─── 质量指标定义 ──────────────────────────────────────────

/** 质量指标表 — 定义可复用的质检指标（如热值、硫分、灰分等） */
export const qualityMetrics = pgTable("quality_metrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQualityMetricSchema = createInsertSchema(qualityMetrics, {
  name: z.string().min(1).max(50),
  unit: z.string().min(1).max(20),
  description: z.string().max(200).optional(),
}).omit({ id: true, createdAt: true });

export const selectQualityMetricSchema = createSelectSchema(qualityMetrics);

export type InsertQualityMetric = z.infer<typeof insertQualityMetricSchema>;
export type SelectQualityMetric = z.infer<typeof selectQualityMetricSchema>;

// ─── 产品-指标关联 ─────────────────────────────────────────

/** 产品指标关联表 — 多对多关系，无外键，应用层校验引用完整性 */
export const productMetrics = pgTable(
  "product_metrics",
  {
    productId: integer("product_id").notNull(),
    metricId: integer("metric_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex("pk_product_metrics").on(t.productId, t.metricId),
    metricIdx: index("idx_pm_metric").on(t.metricId),
  }),
);

export const insertProductMetricSchema = createInsertSchema(productMetrics, {
  productId: z.number().int().positive(),
  metricId: z.number().int().positive(),
}).omit({ createdAt: true });

export type InsertProductMetric = z.infer<typeof insertProductMetricSchema>;
