import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").max(100),
  category: z.string().min(1, "分类不能为空").max(50),
  unit: z.string().max(10).optional().default("吨"),
});
