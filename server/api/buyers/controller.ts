import type { Context } from "hono";

import { created, handleApiError, ok, paginationMeta, parsePositiveId } from "../response";
import * as services from "./services";

export async function list(c: Context) {
  try {
    const search = c.req.query("search");
    const page = Number(c.req.query("page")) || 1;
    const pageSize = Number(c.req.query("pageSize")) || 20;

    const result = await services.listBuyers({ search, page, pageSize });
    return ok(c, result.data, paginationMeta(result.total, result.page, result.pageSize));
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const buyer = await services.createBuyer(body);
    return created(c, buyer);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function update(c: Context) {
  try {
    const id = parsePositiveId(c, "id");
    const body = await c.req.json();
    const buyer = await services.updateBuyer(id, body);
    return ok(c, buyer);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function listProducts(c: Context) {
  try {
    const buyerId = parsePositiveId(c, "id");
    const products = await services.listBuyerProducts(buyerId);
    return ok(c, products);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function updateProducts(c: Context) {
  try {
    const buyerId = parsePositiveId(c, "id");
    const body = await c.req.json();
    const products = await services.replaceBuyerProducts(buyerId, body);
    return ok(c, products);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function listRequirements(c: Context) {
  try {
    const buyerId = parsePositiveId(c, "id");
    const productId = parsePositiveId(c, "productId");
    const requirements = await services.listBuyerProductRequirements(buyerId, productId);
    return ok(c, requirements);
  } catch (error) {
    return handleApiError(c, error);
  }
}

export async function updateRequirements(c: Context) {
  try {
    const buyerId = parsePositiveId(c, "id");
    const productId = parsePositiveId(c, "productId");
    const body = await c.req.json();
    const requirements = await services.replaceBuyerProductRequirements(buyerId, productId, body);
    return ok(c, requirements);
  } catch (error) {
    return handleApiError(c, error);
  }
}
