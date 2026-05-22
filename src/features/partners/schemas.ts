import { z } from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100),
  contact: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
});
