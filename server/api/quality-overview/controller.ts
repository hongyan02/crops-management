import type { Context } from "hono";

import { handleApiError, ok, paginationMeta } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const result = await services.listQualityOverview({
      search: c.req.query("search") || undefined,
      supplierId: c.req.query("supplierId") || undefined,
      category: c.req.query("category") || undefined,
      page: c.req.query("page") || undefined,
      pageSize: c.req.query("pageSize") || undefined,
    });

    return ok(
      c,
      {
        rows: result.rows,
        metrics: result.metrics,
      },
      {
        ...paginationMeta(result.total, result.page, result.pageSize),
        filters: result.filters,
        filterOptions: {
          categories: result.categories,
        },
      },
    );
  } catch (error) {
    return handleApiError(c, error);
  }
}
