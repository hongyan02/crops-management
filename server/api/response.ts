import type { Context } from "hono";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type PaginationMeta = {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export class ApiError extends Error {
  status: 400 | 401 | 403 | 404 | 409 | 500;
  code: ApiErrorCode;
  details?: unknown;

  constructor({
    status,
    code,
    message,
    details,
  }: {
    status: 400 | 401 | 403 | 404 | 409 | 500;
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError({ status: 400, code: "BAD_REQUEST", message, details });
  }

  static unauthorized(message: string, details?: unknown) {
    return new ApiError({ status: 401, code: "UNAUTHORIZED", message, details });
  }

  static forbidden(message: string, details?: unknown) {
    return new ApiError({ status: 403, code: "FORBIDDEN", message, details });
  }

  static notFound(message: string, details?: unknown) {
    return new ApiError({ status: 404, code: "NOT_FOUND", message, details });
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError({ status: 409, code: "CONFLICT", message, details });
  }

  static internal(message = "服务器内部错误", details?: unknown) {
    return new ApiError({ status: 500, code: "INTERNAL_ERROR", message, details });
  }
}

export function paginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    pagination: {
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    },
  };
}

export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>) {
  return c.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(c: Context, data: T, meta?: Record<string, unknown>) {
  return c.json({ success: true, data, ...(meta ? { meta } : {}) }, 201);
}

export function noContent(c: Context) {
  return ok(c, null);
}

export function handleApiError(c: Context, error: unknown) {
  const apiError = normalizeApiError(error);

  return c.json(
    {
      success: false,
      data: null,
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details ? { details: apiError.details } : {}),
      },
    },
    apiError.status,
  );
}

export function parsePositiveId(c: Context, name: string) {
  const id = Number(c.req.param(name));

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest("无效的 ID");
  }

  return id;
}

function normalizeApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "参数校验失败",
      details: error.flatten().fieldErrors,
    });
  }

  if (error instanceof Error) {
    return ApiError.internal();
  }

  return ApiError.internal();
}
