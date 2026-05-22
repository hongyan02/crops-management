"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@server/auth";
import { db } from "@server/db";
import { user } from "@server/db/schema";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

export type SignInActionResult = {
  ok: false;
  message?: string;
  fieldErrors?: Partial<Record<keyof SignInInput, string[] | undefined>>;
};

export async function signInAction(values: SignInInput): Promise<SignInActionResult | void> {
  const parsed = signInSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "请修正表单后重试。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedUsername = parsed.data.username.toLowerCase();
  const candidate = await db
    .select({
      status: user.status,
    })
    .from(user)
    .where(eq(user.username, normalizedUsername))
    .limit(1)
    .then((rows) => rows[0]);

  if (candidate?.status && candidate.status !== "active") {
    return {
      ok: false,
      message: "账号已被停用，请联系管理员处理。",
    };
  }

  try {
    const session = await auth.api.signInUsername({
      body: parsed.data,
      headers: await headers(),
    });

    await db
      .update(user)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));
  } catch {
    return {
      ok: false,
      message: "用户名或密码错误。",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/sign-in");
}
