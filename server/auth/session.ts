import { cache } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./index";
import { hasRequiredRole, normalizeUserRole } from "./roles";
import type { UserRole } from "@server/db/schema/auth";

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }
});

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireSession();
  const role = normalizeUserRole(session.user.role);

  if (!role || !roles.some((requiredRole) => hasRequiredRole(role, requiredRole as UserRole))) {
    redirect("/403");
  }

  return session;
}

export function getNormalizedSessionRole(role?: string | null) {
  return normalizeUserRole(role) ?? "member";
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
