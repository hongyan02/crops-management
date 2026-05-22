import type { Context } from "hono";

import { created, handleApiError, noContent, ok, paginationMeta, parsePositiveId } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const search = c.req.query("search");
    const page = Number(c.req.query("page")) || 1;
    const pageSize = Number(c.req.query("pageSize")) || 20;

    const result = await services.listProducts({ search, page, pageSize });
    return ok(c, result.data, paginationMeta(result.total, result.page, result.pageSize));
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function getById(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const product = await services.getProductById(id);
    return ok(c, product);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function listMetrics(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const metrics = await services.listProductMetrics(id);
    return ok(c, metrics);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const product = await services.createProduct(body);
    return created(c, product);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function update(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const body = await c.req.json();
    const product = await services.updateProduct(id, body);
    return ok(c, product);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function updateMetrics(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const body = await c.req.json();
    const metrics = await services.replaceProductMetrics(id, body);
    return ok(c, metrics);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function remove(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    await services.deleteProduct(id);
    return noContent(c);
  } catch (error) {
    return handleApiError(c, error);
  }
}
