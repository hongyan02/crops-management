import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── 供应商 ───────────────────────────────────────────────

/** 供应商表 — 存储供应商基本信息 */
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
export const supplierProducts = pgTable("supplier_products", {
  supplierId: integer("supplier_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
export const supplierQuality = pgTable("supplier_quality", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  productId: integer("product_id").notNull(),
  metricId: integer("metric_id").notNull(),
  value: text("value").notNull(),
  batchNo: text("batch_no"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
