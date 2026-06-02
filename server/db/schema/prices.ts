import { doublePrecision, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── 供应商产品价格记录 ────────────────────────────────────

/** 供应商产品价格记录表 — 记录供应商产品报价历史 */
export const supplierProductPrices = pgTable(
  "supplier_product_prices",
  {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id").notNull(),
    productId: integer("product_id").notNull(),
    price: doublePrecision("price").notNull(),
    quotedAt: timestamp("quoted_at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    supplierProductIdx: index("idx_spp_supplier_product").on(t.supplierId, t.productId),
    productIdx: index("idx_spp_product").on(t.productId),
    quotedAtIdx: index("idx_spp_quoted_at").on(t.quotedAt),
  }),
);

export const insertSupplierProductPriceSchema = createInsertSchema(supplierProductPrices, {
  supplierId: z.number().int().positive(),
  productId: z.number().int().positive(),
  price: z.number().positive("价格必须大于 0"),
  note: z.string().max(500).optional(),
}).omit({ id: true, createdAt: true });

export const selectSupplierProductPriceSchema = createSelectSchema(supplierProductPrices);

export type InsertSupplierProductPrice = z.infer<typeof insertSupplierProductPriceSchema>;
export type SelectSupplierProductPrice = z.infer<typeof selectSupplierProductPriceSchema>;
