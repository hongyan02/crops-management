import type { Context } from "hono";

import { handleApiError, ok } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const result = await services.listPriceOverview({
      search: c.req.query("search") || undefined,
      category: c.req.query("category") || undefined,
    });

    return ok(
      c,
      {
        products: result.products,
      },
      {
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
