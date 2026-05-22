import type { Context } from "hono";

import { created, handleApiError, ok, paginationMeta } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const result = await services.listLatestPrices({
      search: c.req.query("search") || undefined,
      supplierId: c.req.query("supplierId") || undefined,
      category: c.req.query("category") || undefined,
      page: c.req.query("page") || undefined,
      pageSize: c.req.query("pageSize") || undefined,
    });

    return ok(c, result.data, {
      ...paginationMeta(result.total, result.page, result.pageSize),
      filters: result.filters,
      filterOptions: {
        categories: result.categories,
      },
    });
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const record = await services.createPrice(body);
    return created(c, record);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function history(c: Context) {
  try {
    const records = await services.listPriceHistory({
      supplierId: c.req.query("supplierId") || undefined,
      productId: c.req.query("productId") || undefined,
    });

    return ok(c, records);
  } catch (error) {
    return handleApiError(c, error);
  }
}
