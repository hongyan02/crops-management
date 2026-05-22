import * as z from "zod/v4";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "用户名至少 3 位。")
  .max(30, "用户名不能超过 30 位。")
  .regex(/^[a-zA-Z0-9_.]+$/, "用户名仅支持字母、数字、下划线和点号。");

export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位。")
  .max(128, "密码不能超过 128 位。");

export const signInSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(2, "显示名称至少 2 位。").max(60, "显示名称不能超过 60 位。"),
  email: z.string().trim().email("请输入合法邮箱地址。").transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export const bootstrapAdminSchema = signUpSchema.extend({
  password: z.string().min(12, "初始化管理员密码至少 12 位。").max(128, "初始化管理员密码不能超过 128 位。"),
});

export type SignInInput = z.infer<typeof signInSchema>;
