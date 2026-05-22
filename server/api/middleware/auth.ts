import type { MiddlewareHandler } from "hono";

import { auth } from "@server/auth";
import { hasRequiredRole, normalizeUserRole } from "@server/auth/roles";
import type { UserRole } from "@server/db/schema/auth";
import type { AppBindings, ApiActor } from "../context";
import { ApiError } from "../response";

export const requestContextMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();

  c.set("requestId", requestId);
  c.header("x-request-id", requestId);

  await next();
};

export const sessionAuthMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw ApiError.unauthorized("请先登录后再访问接口");
  }

  const role = normalizeUserRole(session.user.role);
  if (!role) {
    throw ApiError.forbidden("当前账号角色不可用");
  }

  if (session.user.status !== "active") {
    throw ApiError.forbidden("当前账号已被停用");
  }

  const actor: ApiActor = {
    userId: session.user.id,
    sessionId: session.session.id,
    role,
    status: session.user.status,
    email: session.user.email,
    name: session.user.name,
  };

  c.set("actor", actor);
  await next();
};

export function requireRole(requiredRole: UserRole): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const actor = c.get("actor");

    if (!hasRequiredRole(actor.role, requiredRole)) {
      throw ApiError.forbidden("当前账号没有访问该接口的权限");
    }

    await next();
  };
}
