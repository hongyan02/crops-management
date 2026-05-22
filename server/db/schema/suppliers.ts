import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

// ─── 供应商 ───────────────────────────────────────────────

/** 供应商表 — 存储供应商基本信息 */
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, "供应商名称不能为空").max(100),
  contact: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
}).omit({ id: true, createdAt: true });

export const selectSupplierSchema = createSelectSchema(suppliers);

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type SelectSupplier = z.infer<typeof selectSupplierSchema>;

// ─── 供应商-产品关联 ───────────────────────────────────────

/** 供应商产品关联表 — 记录供应商可供应的产品，无外键，应用层校验 */
export const supplierProducts = sqliteTable("supplier_products", {
  supplierId: integer("supplier_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  pk: uniqueIndex("pk_supplier_products").on(t.supplierId, t.productId),
  productIdx: index("idx_sp_product").on(t.productId),
}));

export const insertSupplierProductSchema = createInsertSchema(supplierProducts, {
  supplierId: z.number().int().positive(),
  productId: z.number().int().positive(),
}).omit({ createdAt: true });

export type InsertSupplierProduct = z.infer<typeof insertSupplierProductSchema>;

// ─── 供应商质量记录 ────────────────────────────────────────

/** 供应商质量记录表 — 记录供应商每批次供货的质检数据 */
export const supplierQuality = sqliteTable("supplier_quality", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull(),
  productId: integer("product_id").notNull(),
  metricId: integer("metric_id").notNull(),
  value: text("value").notNull(),
  batchNo: text("batch_no"),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  supplierIdx: index("idx_sq_supplier").on(t.supplierId),
  productIdx: index("idx_sq_product").on(t.productId),
}));

export const insertSupplierQualitySchema = createInsertSchema(supplierQuality, {
  supplierId: z.number().int().positive(),
  productId: z.number().int().positive(),
  metricId: z.number().int().positive(),
  value: z.string().min(1),
  batchNo: z.string().max(50).optional(),
}).omit({ id: true, createdAt: true });

export type InsertSupplierQuality = z.infer<typeof insertSupplierQualitySchema>;
export type SelectSupplierQuality = z.infer<typeof selectSupplierQualitySchema>;

export const selectSupplierQualitySchema = createSelectSchema(supplierQuality);
