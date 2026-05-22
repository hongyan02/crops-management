import { Hono } from "hono";

import * as controller from "./controller";

const suppliersRoute = new Hono();

suppliersRoute.get("/", controller.list);
suppliersRoute.post("/", controller.create);
suppliersRoute.put("/:id", controller.update);
suppliersRoute.get("/:id/products", controller.listProducts);
suppliersRoute.put("/:id/products", controller.updateProducts);
suppliersRoute.get("/:id/products/:productId/quality", controller.listQuality);
suppliersRoute.post("/:id/products/:productId/quality", controller.createQuality);

export { suppliersRoute };
