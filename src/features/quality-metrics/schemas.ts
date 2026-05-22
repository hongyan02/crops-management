import { z } from "zod";

export const metricSchema = z.object({
  name: z.string().min(1, "指标名称不能为空").max(50),
  unit: z.string().min(1, "单位不能为空").max(20),
  description: z.string().max(200).optional(),
});
