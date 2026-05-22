import type { Context, Next } from "hono";

const BODY_LOG_METHODS = new Set(["POST", "PUT", "PATCH"]);
const SENSITIVE_FIELDS = ["password", "token", "authorization", "cookie", "email", "phone", "address"];

function shouldLogBody() {
  return process.env.NODE_ENV !== "production" || process.env.LOG_REQUEST_BODIES === "true";
}

function maskSensitiveData(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase();
    masked[key] = SENSITIVE_FIELDS.some((field) => normalizedKey.includes(field))
      ? "***"
      : maskSensitiveData(entry);
  }

  return masked;
}

function getClientIp(c: Context) {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown";
}

export function customLogger() {
  return async (c: Context, next: Next) => {
    const startedAt = Date.now();
    const requestId = c.get("requestId") as string | undefined;
    const method = c.req.method;
    const path = c.req.path;
    const ip = getClientIp(c);
    let requestBody: unknown = null;

    if (shouldLogBody() && BODY_LOG_METHODS.has(method)) {
      try {
        requestBody = await c.req.raw.clone().json();
      } catch {
        requestBody = null;
      }
    }

    await next();

    const actor = c.var.actor;
    const durationMs = Date.now() - startedAt;

    const payload = {
      requestId,
      actorId: actor?.userId ?? null,
      role: actor?.role ?? null,
      method,
      path,
      status: c.res.status,
      durationMs,
      ip,
      ...(requestBody ? { body: maskSensitiveData(requestBody) } : {}),
    };

    console.log(JSON.stringify(payload));
  };
}
