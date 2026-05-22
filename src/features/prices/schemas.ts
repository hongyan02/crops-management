import { z } from "zod";

export const priceFormSchema = z.object({
  supplierId: z.coerce.number().int().positive("请选择供应商"),
  productId: z.coerce.number().int().positive("请选择产品"),
  price: z.coerce.number().positive("请输入有效价格"),
  quotedAt: z.string().min(1, "请选择报价时间"),
  note: z.string().trim().max(500, "备注不能超过 500 个字符").optional(),
});
