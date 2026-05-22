import type { Context } from "hono";

import { created, handleApiError, noContent, ok, paginationMeta, parsePositiveId } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const search = c.req.query("search");
    const page = Number(c.req.query("page")) || 1;
    const pageSize = Number(c.req.query("pageSize")) || 20;

    const result = await services.listMetrics({ search, page, pageSize });
    return ok(c, result.data, paginationMeta(result.total, result.page, result.pageSize));
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function getById(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const metric = await services.getMetricById(id);
    return ok(c, metric);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const metric = await services.createMetric(body);
    return created(c, metric);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function update(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const body = await c.req.json();
    const metric = await services.updateMetric(id, body);
    return ok(c, metric);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function remove(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    await services.deleteMetric(id);
    return noContent(c);
  } catch (error) {
    return handleApiError(c, error);
  }
}
