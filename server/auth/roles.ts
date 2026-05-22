import type { UserRole } from "@server/db/schema/auth";

const LEGACY_ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function normalizeUserRole(role?: string | null): UserRole | null {
  if (!role) {
    return null;
  }

  if (LEGACY_ADMIN_ROLES.has(role)) {
    return "admin";
  }

  if (role === "member") {
    return "member";
  }

  return null;
}

export function hasRequiredRole(currentRole: UserRole, requiredRole: UserRole) {
  if (currentRole === "admin") {
    return true;
  }

  return currentRole === requiredRole;
}
